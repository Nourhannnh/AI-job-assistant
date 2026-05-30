# AI Interview Simulator

Practice technical interviews with an AI that actually pushes back.

You pick a role and difficulty. It generates real questions. You answer. It tells you where you were right, where you were vague, and what a better answer looks like. Then you do it again.

Built with Python and Streamlit, powered by OpenAI.

---

## What it does

Select from 10 tech roles — Software Engineer, Data Scientist, ML Engineer, Backend Developer, and more — across three difficulty levels: Junior, Mid-level, and Senior.

Each session runs 5 questions. After you answer each one, the AI scores your response on three dimensions:

- **Correctness** — was it technically accurate?
- **Clarity** — was it well-structured and easy to follow?
- **Depth** — did you show real understanding or just surface knowledge?

Your overall score is a weighted average (50% correctness, 25% clarity, 25% depth). At the end you get a full breakdown: what you did well, what to improve, and a model answer for each question.

The Dashboard tab tracks your scores across sessions so you can actually see whether you're getting better.

---

## Stack

- **Python** with **Streamlit** for the UI
- **OpenAI API** for question generation and answer evaluation
- Session state for in-memory history tracking

---

## How to run it

Clone the repo and go into the app folder:

```
cd ai-interview-simulator
```

Install dependencies:

```
pip install -r requirements.txt
```

Add your OpenAI key to a `.env` file:

```
OPENAI_API_KEY=your_key_here
```

Run it:

```
streamlit run app.py
```

If you're on Replit, it picks up the credentials automatically through the AI Integrations proxy — no setup needed.

---

## Project structure

```
ai-interview-simulator/
├── app.py                   # Main Streamlit app, all UI logic lives here
├── modules/
│   ├── config.py            # Roles, difficulty levels, scoring weights
│   ├── question_generator.py # Calls OpenAI to generate role-specific questions
│   ├── answer_evaluator.py   # Calls OpenAI to score and give feedback on answers
│   ├── session_manager.py    # Manages session state and history
│   └── dashboard.py         # Charts and visualizations (gauge, radar, history)
└── requirements.txt
```

---

## A note on the architecture

The question generator and answer evaluator both return structured JSON from the model. The evaluator prompt is explicit about what format it expects — correctness, clarity, depth scores, strengths list, improvements list, and a model answer. The overall score is computed on the Python side, not by the model, so the math is always consistent regardless of what the model returns.

Questions are generated fresh each session based on role and difficulty. Nothing is hardcoded.
