import pytest
from httpx import Client

@pytest.fixture
async def client():
    async with Client(base_url="http://test") as ac:
        yield ac