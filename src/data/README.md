# Static Data Files

This directory contains static JSON data files used by the application since the Airtable API backend is no longer available.

## Files

### agents.json
Contains agent data with the following structure:
- `id`: Unique identifier (format: recAgentXXX)
- `createdTime`: ISO 8601 timestamp
- `code`: Agent code (2-letter abbreviation)
- `agent_name`: Agent's first name
- `agent_surname`: Agent's last name
- `color`: Hex color code for agent identification

### contacts.json
Contains contact/customer data with the following structure:
- `id`: Unique identifier (format: recContactXXX)
- `createdTime`: ISO 8601 timestamp
- `contact_id`: Business contact ID
- `contact_name`: Full name
- `contact_email`: Email address
- `contact_phone`: Phone number with country code

### appointments.json
Contains appointment data with the following structure:
- `id`: Unique identifier (format: recApptXXX)
- `createdTime`: ISO 8601 timestamp
- `appointment_id`: Business appointment ID
- `appointment_date`: ISO 8601 timestamp for the appointment
- `appointment_address`: Full property address
- `contact_id`: Array of contact IDs (references contacts.json)
- `contact_name`: Array of contact names
- `contact_email`: Array of contact emails
- `contact_phone`: Array of contact phone numbers
- `agent_id`: Array of agent IDs (references agents.json)
- `agent_name`: Array of agent first names
- `agent_surname`: Array of agent last names
- `is_cancelled`: Boolean indicating if appointment is cancelled

## Usage

The service files in `src/api/services/` import these JSON files directly and return them in the same format that the Airtable API used to return.

## Note

Since the data is static:
- Any create/update/delete operations will show success messages but **will not persist** after page refresh
- To add new data, manually edit the JSON files
- Ensure the data structure remains consistent when making changes
