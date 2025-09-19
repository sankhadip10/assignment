import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import List
# import models
from . import models


load_dotenv()

# Configure the OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE"),
)

def generate_summary(todos: List[models.Todo]) -> str:
    """
    Generates a summary of the todos using an AI model.
    """
    if not todos:
        return "You have no tasks. Enjoy your day!"

    # Format the todos into a string for the prompt
    todo_list_str = "\n".join(
        [
            (
                f"- {t.title} (Due: {t.due_date.strftime('%Y-%m-%d')}, "
                f"Status: {'Completed' if t.completed else 'Pending'})")
            for t in todos
        ]
    )

    # Create the prompt
    prompt = (
        "You are a helpful assistant. Please provide a brief, friendly, and encouraging summary "
        "of the following tasks. Mention any overdue tasks first, then tasks due today, "
        "and finally any upcoming tasks. Keep the summary to a maximum of 3-4 sentences.\n\n"
        f"Here are the tasks:\n{todo_list_str}"
    )

    try:
        # Make the API call
        response = client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are a helpful assistant."}, 
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=150,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Handle potential API errors
        print(f"An error occurred: {e}")
        return "Sorry, I couldn't generate a summary at the moment. Please check your AI configuration."
