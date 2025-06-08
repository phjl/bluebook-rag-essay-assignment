from deepeval.evaluate import evaluate
from deepeval.synthesizer import Synthesizer
from deepeval.models import GPTModel
from supabase import create_client, Client
from dotenv import load_dotenv
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../python/utils')))
from essay import get_essays

def synthesize_goldens(context):
    synthesizer = Synthesizer()
    synthesizer.generate_goldens_from_contexts(context, include_expected_output=True)
    synthesizer.save_as(
        file_type="json",
        directory="./tests/python/data/goldens",
        file_name="chat_goldens.json"
    )
    print(synthesizer.synthetic_goldens())


def main():
    load_dotenv(".env.local")
    essays = get_essays(10)
    essay_contexts = [[essay] for essay in essays]
    synthesize_goldens(essay_contexts)

if __name__ == "__main__":
    main()
