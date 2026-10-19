import os
import time
import requests
import logging

logger = logging.getLogger(__name__)

# Execution configuration
DEFAULT_JUDGE0_URL = "https://ce.judge0.com/submissions"
DEFAULT_PISTON_URL = "https://emkc.org/api/v2/piston/execute"
EXECUTION_TIMEOUT = 15  # seconds

# Language configuration mapping for Judge0 CE (https://ce.judge0.com/languages)
JUDGE0_LANGUAGES = {
    'python': 71,  # Python (3.8.1)
    'java': 62,    # Java (OpenJDK 13.0.1)
    'cpp': 54,     # C++ (GCC 9.2.0)
}

# Language configuration mapping for Piston
PISTON_LANGUAGES = {
    'python': {'language': 'python', 'version': '3.10.0', 'filename': 'solution.py'},
    'java': {'language': 'java', 'version': '15.0.2', 'filename': 'Main.java'},
    'cpp': {'language': 'c++', 'version': '10.2.0', 'filename': 'solution.cpp'},
}


def normalize_output(text: str) -> str:
    """Normalize line endings and whitespace for output comparison."""
    if text is None:
        return ""
    # Split into lines, strip trailing spaces, rejoin with \n, strip outer whitespace
    lines = [line.rstrip() for line in text.replace('\r\n', '\n').replace('\r', '\n').split('\n')]
    return '\n'.join(lines).strip()


class CodeExecutionService:
    """
    Secure isolated code execution service.
    Forwards code execution requests to a sandboxed external runner (Judge0 CE / Piston).
    Never executes arbitrary untrusted code directly on the Django host machine.
    """

    def __init__(self):
        # Default to judge0 which is open and active
        self.provider = os.environ.get('CODE_EXECUTION_PROVIDER', 'judge0').lower()
        self.judge0_url = os.environ.get('JUDGE0_API_URL', DEFAULT_JUDGE0_URL)
        self.judge0_key = os.environ.get('JUDGE0_API_KEY', '')
        self.piston_url = os.environ.get('PISTON_API_URL', DEFAULT_PISTON_URL)

    def execute_single_case(self, language: str, code: str, stdin_data: str, expected_output: str) -> dict:
        """
        Execute code with given stdin against a single testcase.
        Returns evaluation dict with:
        passed, status, stdout, stderr, execution_time_ms, expected_output, actual_output, error_message.
        """
        lang_key = language.lower()
        if lang_key not in JUDGE0_LANGUAGES and lang_key not in PISTON_LANGUAGES:
            return {
                'passed': False,
                'status': 'compilation_error',
                'stdout': '',
                'stderr': f"Unsupported language '{language}'. Supported: python, java, cpp.",
                'execution_time_ms': 0,
                'expected_output': expected_output,
                'actual_output': '',
                'error_message': f"Unsupported language '{language}'",
            }

        start_time = time.time()

        try:
            if self.provider == 'piston':
                raw_res = self._execute_piston(lang_key, code, stdin_data)
            else:
                raw_res = self._execute_judge0(lang_key, code, stdin_data)

            elapsed_ms = raw_res.get('execution_time_ms')
            if elapsed_ms is None or elapsed_ms <= 0:
                elapsed_ms = round((time.time() - start_time) * 1000, 2)

            stdout = raw_res.get('stdout', '') or ''
            stderr = raw_res.get('stderr', '') or ''
            exit_code = raw_res.get('exit_code', 0)
            timed_out = raw_res.get('timed_out', False)

            # Check execution outcomes
            if timed_out:
                return {
                    'passed': False,
                    'status': 'time_limit_exceeded',
                    'stdout': stdout,
                    'stderr': stderr or 'Time limit exceeded (10s limit).',
                    'execution_time_ms': elapsed_ms,
                    'expected_output': expected_output,
                    'actual_output': stdout,
                    'error_message': 'Time limit exceeded (10s limit).',
                }

            # Check compile error vs runtime error
            if raw_res.get('compile_error'):
                return {
                    'passed': False,
                    'status': 'compilation_error',
                    'stdout': stdout,
                    'stderr': stderr,
                    'execution_time_ms': elapsed_ms,
                    'expected_output': expected_output,
                    'actual_output': stdout,
                    'error_message': stderr or 'Compilation Error',
                }

            if exit_code != 0 and stderr:
                return {
                    'passed': False,
                    'status': 'runtime_error',
                    'stdout': stdout,
                    'stderr': stderr,
                    'execution_time_ms': elapsed_ms,
                    'expected_output': expected_output,
                    'actual_output': stdout,
                    'error_message': stderr,
                }

            # Compare normalized outputs
            norm_actual = normalize_output(stdout)
            norm_expected = normalize_output(expected_output)

            passed = (norm_actual == norm_expected)
            status = 'accepted' if passed else 'wrong_answer'

            return {
                'passed': passed,
                'status': status,
                'stdout': stdout,
                'stderr': stderr,
                'execution_time_ms': elapsed_ms,
                'expected_output': expected_output,
                'actual_output': stdout,
                'error_message': '' if passed else 'Output does not match expected output',
            }

        except requests.exceptions.Timeout:
            logger.warning("Code execution request timed out")
            return {
                'passed': False,
                'status': 'time_limit_exceeded',
                'stdout': '',
                'stderr': 'Execution request timed out.',
                'execution_time_ms': round((time.time() - start_time) * 1000, 2),
                'expected_output': expected_output,
                'actual_output': '',
                'error_message': 'Execution request timed out.',
            }
        except requests.exceptions.RequestException as ex:
            logger.error(f"External code execution service error: {ex}")
            return {
                'passed': False,
                'status': 'internal_error',
                'stdout': '',
                'stderr': f"Code execution service temporarily unreachable: {str(ex)}",
                'execution_time_ms': round((time.time() - start_time) * 1000, 2),
                'expected_output': expected_output,
                'actual_output': '',
                'error_message': 'Execution service is temporarily unavailable. Please try again.',
            }
        except Exception as ex:
            logger.error(f"Unexpected execution error: {ex}")
            return {
                'passed': False,
                'status': 'internal_error',
                'stdout': '',
                'stderr': str(ex),
                'execution_time_ms': round((time.time() - start_time) * 1000, 2),
                'expected_output': expected_output,
                'actual_output': '',
                'error_message': f"Unexpected error: {str(ex)}",
            }

    def _execute_judge0(self, language: str, code: str, stdin_data: str) -> dict:
        """Call Judge0 CE isolated runner."""
        lang_id = JUDGE0_LANGUAGES.get(language, 71)
        headers = {
            'Content-Type': 'application/json',
        }
        if self.judge0_key:
            headers['X-RapidAPI-Key'] = self.judge0_key
            headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'

        payload = {
            'source_code': code,
            'language_id': lang_id,
            'stdin': stdin_data or '',
            'cpu_time_limit': 6.0,
            'memory_limit': 128000,
        }

        url = f"{self.judge0_url}?wait=true"
        resp = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=EXECUTION_TIMEOUT,
        )

        if resp.status_code not in (200, 201):
            raise requests.RequestException(f"Judge0 responded with HTTP {resp.status_code}: {resp.text}")

        data = resp.json()
        status_id = data.get('status', {}).get('id', 0)

        # Judge0 status IDs:
        # 1 = In Queue, 2 = Processing, 3 = Accepted, 4 = Wrong Answer,
        # 5 = Time Limit Exceeded, 6 = Compilation Error, 7-12 = Runtime Error
        compile_error = (status_id == 6)
        timed_out = (status_id == 5)
        exit_code = 0 if status_id in (3, 4) else 1

        exec_time_sec = data.get('time')
        exec_time_ms = round(float(exec_time_sec) * 1000, 2) if exec_time_sec is not None else 0.0

        return {
            'compile_error': compile_error,
            'exit_code': exit_code,
            'stdout': data.get('stdout') or '',
            'stderr': data.get('stderr') or data.get('compile_output') or '',
            'timed_out': timed_out,
            'execution_time_ms': exec_time_ms,
        }

    def _execute_piston(self, language: str, code: str, stdin_data: str) -> dict:
        """Call Piston API isolated runner."""
        cfg = PISTON_LANGUAGES[language]
        payload = {
            'language': cfg['language'],
            'version': cfg['version'],
            'files': [
                {
                    'name': cfg['filename'],
                    'content': code,
                }
            ],
            'stdin': stdin_data or '',
            'run_timeout': 8000,
            'compile_timeout': 10000,
        }

        resp = requests.post(
            self.piston_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=EXECUTION_TIMEOUT,
        )

        if resp.status_code != 200:
            raise requests.RequestException(f"Piston responded with HTTP {resp.status_code}: {resp.text}")

        data = resp.json()
        compile_stage = data.get('compile')
        run_stage = data.get('run', {})

        if compile_stage and compile_stage.get('code') != 0:
            return {
                'compile_error': True,
                'exit_code': compile_stage.get('code', 1),
                'stdout': compile_stage.get('stdout', ''),
                'stderr': compile_stage.get('stderr') or compile_stage.get('output', ''),
                'timed_out': False,
            }

        signal = run_stage.get('signal')
        timed_out = signal == 'SIGKILL' or 'SIGTERM' in str(signal) or 'timeout' in (run_stage.get('stderr') or '').lower()

        return {
            'compile_error': False,
            'exit_code': run_stage.get('code', 0),
            'stdout': run_stage.get('stdout', ''),
            'stderr': run_stage.get('stderr', ''),
            'timed_out': timed_out,
        }


# Singleton instance
execution_service = CodeExecutionService()
