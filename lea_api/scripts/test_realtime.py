"""Test access OpenAI Realtime API via your API key."""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_realtime():
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Create a Realtime client secret (proves API access)
        response = await client.realtime.client_secrets.create(
            session={
                "type": "realtime",
                "model": "gpt-4o-realtime-preview-2024-12-17",
                "audio": {"output": {"voice": "alloy"}},
            }
        )
        print("OK Realtime API accessible!")
        print(f"Client secret expires_at: {response.expires_at}")
        print(f"Model: {response.session.model}")
    except Exception as e:
        error = str(e)
        if "403" in error or "forbidden" in error.lower():
            print("KO No access to Realtime API on this account.")
        elif "404" in error:
            print("KO Endpoint not found - incorrect model.")
        else:
            print(f"KO Error: {error}")

if __name__ == "__main__":
    asyncio.run(test_realtime())
