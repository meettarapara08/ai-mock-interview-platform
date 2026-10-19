"""
Gemini AI Service for interview question generation and answer evaluation.

Calls the Google Gemini API exclusively from the Django backend.
API keys are read from environment variables — never exposed to the frontend.
"""

import json
import logging
import os

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

# ─── Gemini Client Setup ───

_gemini_client = None


def _get_gemini_client():
    """Lazy-initialise the Gemini client. Returns None when no API key is set."""
    global _gemini_client
    api_key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not api_key:
        logger.warning('GEMINI_API_KEY is not set. AI features will use fallback question bank.')
        return None

    if _gemini_client is not None and getattr(_gemini_client, '_saved_key', None) == api_key:
        return _gemini_client

    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        _gemini_client._saved_key = api_key
        logger.info('Gemini client initialised successfully.')
        return _gemini_client
    except Exception as exc:
        logger.error('Failed to initialise Gemini client: %s', exc)
        return None


# ─── Retry Decorator ───

class GeminiTransientError(Exception):
    """Wrapper for transient Gemini errors that should be retried."""
    pass


GEMINI_MODELS = [
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
]


def _gemini_call_with_retry(prompt, response_schema_hint=''):
    """
    Call Gemini with bounded retries across candidate models.
    Returns the parsed JSON dict/list, or None on failure.
    """
    client = _get_gemini_client()
    if client is None:
        return None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(GeminiTransientError),
        reraise=True,
    )
    def _call():
        last_exception = None
        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                        'temperature': 0.7,
                        'max_output_tokens': 4096,
                    },
                )
                text = response.text.strip()
                if not text:
                    raise GeminiTransientError(f'Empty response from Gemini model {model_name}')
                return json.loads(text)
            except json.JSONDecodeError as exc:
                logger.error('Gemini model %s returned invalid JSON: %s', model_name, exc)
                last_exception = exc
                continue
            except Exception as exc:
                last_exception = exc
                error_name = type(exc).__name__
                # Treat transient errors by trying the next model
                if any(keyword in error_name.lower() or keyword in str(exc).lower() for keyword in ['server', 'rate', 'quota', 'timeout', 'resource', '429', '500', '503']):
                    logger.warning('Transient error on model %s: %s. Trying fallback model...', model_name, exc)
                    continue
                logger.warning('Model %s failed: %s. Trying fallback model...', model_name, exc)
                continue

        # If all candidate models failed, raise transient error to allow retry
        if last_exception:
            raise GeminiTransientError(f'All Gemini candidate models failed: {last_exception}') from last_exception
        return None

    try:
        return _call()
    except GeminiTransientError as exc:
        logger.error('Gemini call failed after retries: %s', exc)
        return None
    except Exception as exc:
        logger.error('Unexpected error in Gemini call: %s', exc)
        return None


# ─── Question Generation ───

def generate_resume_questions(resume_data, job_role, difficulty, num_questions):
    """
    Generate targeted interview questions based on the candidate's actual resume data.
    """
    name = resume_data.get('candidate_name', '')
    summary = resume_data.get('summary', '')
    skills_list = resume_data.get('skills', [])
    skills_str = ', '.join(skills_list) if isinstance(skills_list, list) else str(skills_list)

    # Format projects
    projects = resume_data.get('projects', [])
    formatted_projects = "None listed"
    if projects and isinstance(projects, list):
        p_items = []
        for p in projects[:4]:
            if isinstance(p, dict):
                title = p.get('title', 'Project')
                tech = ', '.join(p.get('technologies', [])) if isinstance(p.get('technologies'), list) else ''
                desc = p.get('description', '')
                p_items.append(f"- {title} ({tech}): {desc}")
            else:
                p_items.append(f"- {p}")
        formatted_projects = "\n  ".join(p_items)

    # Format work experience
    experience = resume_data.get('experience', [])
    formatted_experience = "None listed"
    if experience and isinstance(experience, list):
        e_items = []
        for exp in experience[:3]:
            if isinstance(exp, dict):
                role = exp.get('role', 'Role')
                company = exp.get('company', 'Company')
                highlights = '; '.join(exp.get('highlights', [])) if isinstance(exp.get('highlights'), list) else ''
                e_items.append(f"- {role} at {company}: {highlights}")
            else:
                e_items.append(f"- {exp}")
        formatted_experience = "\n  ".join(e_items)

    prompt = f"""You are a principal engineering hiring manager conducting a resume-based interview for a {job_role} position at {difficulty} difficulty.
Review the candidate's verified resume profile below and generate exactly {num_questions} targeted interview questions.

CANDIDATE RESUME PROFILE:
Candidate Name: {name or 'Candidate'}
Professional Summary: {summary or 'N/A'}
Skills: {skills_str or 'N/A'}
Notable Projects:
  {formatted_projects}
Work Experience:
  {formatted_experience}

REQUIREMENTS:
- Each question must directly reference specific projects, technologies, or work experience claimed on this resume.
- For projects: Ask about architectural decisions, tradeoffs, performance optimizations, and challenges faced.
- For work experience: Ask about specific responsibilities, problem-solving, and collaboration.
- For claimed skills: Test practical hands-on application and real-world edge cases.
- Calibrate question depth for difficulty level "{difficulty}".
- Questions should progress from reviewing their featured projects to deeper technical and behavioral scrutiny.

Return a JSON object with this exact structure:
{{
  "questions": [
    "In your project [Project Name], you mentioned using [Technology]. What was the biggest technical bottleneck you encountered and how did you resolve it?",
    "Question 2 text here"
  ]
}}

Return exactly {num_questions} questions. Each question should be a single string."""

    result = _gemini_call_with_retry(prompt)
    if result is None:
        return None

    questions = result.get('questions', [])
    if not isinstance(questions, list) or len(questions) == 0:
        logger.error('Gemini returned invalid resume questions structure: %s', result)
        return None

    validated = [str(q).strip() for q in questions if q and str(q).strip()]
    if len(validated) == 0:
        logger.error('All Gemini resume questions were empty after validation')
        return None

    return validated[:num_questions]


def generate_questions(interview_type, job_role, difficulty, num_questions, user_skills='', resume_data=None):
    """
    Generate interview questions using Gemini.
    If interview_type == 'resume' and resume_data is provided, generates
    resume-customized questions.

    Returns a list of question strings, or None if Gemini is unavailable.
    """
    if interview_type == 'resume' and resume_data:
        res = generate_resume_questions(resume_data, job_role, difficulty, num_questions)
        if res:
            return res

    skills_context = ''
    if user_skills:
        skills_context = f"\nThe candidate's skills include: {user_skills}."

    prompt = f"""You are an expert interview coach. Generate exactly {num_questions} {difficulty}-difficulty 
{interview_type} interview questions for a {job_role} position.{skills_context}

Requirements:
- Each question should be clear, professional, and relevant to the role.
- Questions should progress from foundational to more advanced.
- For technical interviews: focus on technical concepts, problem-solving, and practical scenarios.
- For behavioral interviews: use the STAR method format (Situation, Task, Action, Result).
- For HR interviews: focus on company culture fit, salary expectations, career goals, and work preferences.
- For managerial interviews: focus on leadership, team management, conflict resolution, and strategic thinking.
- For resume interviews: focus on projects, work experience, and applied skills.
- Difficulty "{difficulty}" means:
  - easy: entry-level, straightforward questions
  - medium: intermediate questions requiring some experience
  - hard: advanced questions requiring deep expertise

Return a JSON object with this exact structure:
{{
  "questions": [
    "Question 1 text here",
    "Question 2 text here"
  ]
}}

Return exactly {num_questions} questions. Each question should be a single string."""

    result = _gemini_call_with_retry(prompt)
    if result is None:
        return None

    # Validate response structure
    questions = result.get('questions', [])
    if not isinstance(questions, list) or len(questions) == 0:
        logger.error('Gemini returned invalid questions structure: %s', result)
        return None

    # Ensure all items are non-empty strings
    validated = [str(q).strip() for q in questions if q and str(q).strip()]
    if len(validated) == 0:
        logger.error('All Gemini questions were empty after validation')
        return None

    return validated[:num_questions]


# ─── Answer Evaluation ───

def evaluate_answer(question_text, answer_text, job_role, interview_type):
    """
    Evaluate a candidate's answer using Gemini.

    Returns a dict with scores and feedback, or None if Gemini is unavailable.
    """
    prompt = f"""You are an expert interview evaluator. Evaluate the following interview answer.

Interview Type: {interview_type}
Job Role: {job_role}

Question: {question_text}

Candidate's Answer: {answer_text}

Evaluate the answer on these four criteria (score each 0-100):
1. **Knowledge**: Does the answer demonstrate relevant technical/domain knowledge?
2. **Relevance**: Does the answer directly address the question asked?
3. **Completeness**: Is the answer thorough and well-structured?
4. **Communication**: Is the answer clearly expressed and well-organized?

Return a JSON object with this exact structure:
{{
  "knowledge_score": 0-100,
  "relevance_score": 0-100,
  "completeness_score": 0-100,
  "communication_score": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "feedback_text": "A brief 2-3 sentence overall feedback summary."
}}

Be fair and constructive. Provide actionable feedback."""

    result = _gemini_call_with_retry(prompt)
    if result is None:
        return None

    # Validate required fields
    required_score_fields = ['knowledge_score', 'relevance_score', 'completeness_score', 'communication_score']
    for field in required_score_fields:
        val = result.get(field)
        if val is None:
            logger.error('Missing required field "%s" in Gemini evaluation', field)
            return None
        try:
            f_val = float(val)
            if 0.0 < f_val <= 1.0:
                score = int(round(f_val * 100))
            else:
                score = int(round(f_val))
            if score < 0 or score > 100:
                logger.error('Score "%s" out of range: %d', field, score)
                return None
            result[field] = score
        except (ValueError, TypeError):
            logger.error('Invalid score value for "%s": %s', field, val)
            return None

    # Ensure list fields are lists of strings
    for list_field in ['strengths', 'weaknesses', 'suggestions']:
        val = result.get(list_field, [])
        if not isinstance(val, list):
            result[list_field] = [str(val)] if val else []
        else:
            result[list_field] = [str(item) for item in val if item]

    # Ensure feedback_text is a string
    result['feedback_text'] = str(result.get('feedback_text', ''))

    # Compute overall score
    result['overall_score'] = round(
        (result['knowledge_score'] + result['relevance_score'] +
         result['completeness_score'] + result['communication_score']) / 4.0,
        2,
    )

    return result


# ─── Follow-up Question Generation ───

def generate_follow_up_question(
    previous_question, previous_answer, job_role, interview_type, difficulty
):
    """
    Generate a contextual follow-up question based on the previous Q&A pair.

    Returns a question string, or None if Gemini is unavailable.
    """
    prompt = f"""You are an expert interviewer conducting a {interview_type} interview for a {job_role} position 
at {difficulty} difficulty level.

The candidate just answered a question. Based on their response, generate ONE relevant follow-up question 
that probes deeper into their answer or explores a related topic.

Previous Question: {previous_question}

Candidate's Answer: {previous_answer}

Requirements:
- The follow-up should be directly related to the candidate's response.
- It should challenge the candidate to elaborate, clarify, or demonstrate deeper understanding.
- Keep it concise and professional.

Return a JSON object with this exact structure:
{{
  "follow_up_question": "Your follow-up question here"
}}"""

    result = _gemini_call_with_retry(prompt)
    if result is None:
        return None

    question = result.get('follow_up_question', '').strip()
    if not question:
        logger.error('Gemini returned empty follow-up question')
        return None

    return question
