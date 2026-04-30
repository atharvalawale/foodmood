# This file creates ONE connection to Supabase
# We import this in every other file that needs the database

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load the .env file so we can read SUPABASE_URL and SUPABASE_KEY
load_dotenv()

# Read the keys from .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create the Supabase client (this is our "connection" to the database)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)