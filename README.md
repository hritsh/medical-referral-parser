<img src="./frontend/public/referral-parser.svg" width="64" height="64" alt="referral parser icon" />

# Medical Referral Parser & Tracker

a tool that uses generative ai to help dme (durable medical equipment) intake coordinators parse and process medical referrals. it uses a fastapi backend (making calls to the gemini api) and a react frontend.

<p align="center">
  <img src="./frontend/public/demo.gif" alt="demo" width="800"/>
  <br/>
</p>

> [!NOTE]
> initial load time may be slow as the backend wakes up from idling on render.com free tier (usually takes ~10-20 seconds). subsequent requests should be fast.

## feature overview

- upload pdf referrals or paste raw fax/document text
- ai-powered extraction of patient info, insurance, diagnosis, and supplies using gemini api
- auto-detects missing info and suggests next steps for intake coordinators
- save parsed referrals to a database for tracking
- view all referrals in a table with status management
- filter and sort referrals by status (new, pending insurance, pending auth, pending docs, complete)
- wound care / dme focused - built around verse's [generic order form](https://versemedical.com/ordersheets/VerseMedicalOrderSheet.pdf) fields

## stuff used

- [fastapi](https://fastapi.tiangolo.com/) for the backend api that parses referrals and makes calls to the gemini api
- [gemini api](https://developers.generativeai.google/products/gemini) (gemini-2.0-flash) for parsing messy referral documents into structured data
- [pypdf](https://pypdf.readthedocs.io/) for extracting text from uploaded pdf files
- [sqlite](https://www.sqlite.org/) for storing parsed referrals
- [react + vite + typescript](https://vitejs.dev/guide/) for the frontend
- [shadcn/ui](https://ui.shadcn.com/) with tailwind for prebuilt react components
- [render.com](https://render.com/) for hosting the backend api and sqlite database
- [vercel](https://vercel.com/) for hosting the frontend app

## data extracted

the ai extracts these fields from referral documents:

| Field               | Description                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| Patient Name        | full patient name                                                                   |
| DOB                 | date of birth                                                                       |
| Insurance           | insurance company/plan (medicare, medicaid, aetna, etc)                             |
| Policy Number       | member id, policy number                                                            |
| Referring Physician | doctor who sent the referral                                                        |
| Physician NPI       | national provider identifier                                                        |
| Diagnosis           | icd-10 codes and descriptions                                                       |
| HCPCS Codes         | billing codes for supplies                                                          |
| Supplies Requested  | list of dme/wound care supplies needed                                              |
| Clinical Notes      | relevant clinical justification                                                     |
| Delivery Address    | where to ship supplies                                                              |
| Missing Info        | critical info that's missing (would block processing)                               |
| Next Steps          | practical actions for intake team ("verify eligibility", "call for signature", etc) |

## workflow

1. **parse** - upload a pdf or paste referral text
2. **review** - ai extracts patient data, insurance, supplies, and identifies missing info
3. **save** - save to database with auto-assigned status based on what's missing
4. **track** - view all referrals in table, update status as you work through them
5. **complete** - mark orders complete when processed

## screenshots

1. referral parsing view
<img width="1512" height="950" alt="image" src="https://github.com/user-attachments/assets/8b83f4e4-62d9-48f4-9395-ed799c932ba5" />

2. parsed referral with analysis & next steps
<img width="1512" height="950" alt="image" src="https://github.com/user-attachments/assets/867fb495-60b0-40fa-92f4-59f16d57d768" />

3. orders table with status management
<img width="1512" height="950" alt="image" src="https://github.com/user-attachments/assets/b8f59032-3c25-4514-9e5a-aec710a9e453" />

4. order detail modal
<img width="1512" height="950" alt="image" src="https://github.com/user-attachments/assets/b24b1743-94e1-41a0-933e-e50910cfcc27" />

## setup instructions

### backend

1. cd into the `backend` folder
2. create a virtual environment: `python -m venv venv`
3. activate the virtual environment:
   - on mac/linux: `source venv/bin/activate`
   - on windows: `venv\Scripts\activate`
4. install dependencies: `pip install -r requirements.txt`
5. copy the `.env.example` file to `.env` and add your gemini api key
6. run the backend server: `python main.py`
7. the backend api will be running at `http://0.0.0.0:8000`

### frontend

1. cd into the `frontend` folder
2. install dependencies: `npm install`
3. run the frontend dev server: `npm run dev`
4. the frontend app will be running at `http://localhost:5173`

## api endpoints

| Method | Endpoint                 | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| GET    | `/`                      | health check                          |
| GET    | `/referrals`             | get all saved referrals               |
| GET    | `/referrals/{id}`        | get a specific referral               |
| POST   | `/parse`                 | parse referral from text              |
| POST   | `/parse/pdf`             | parse referral from pdf upload        |
| POST   | `/save`                  | save a parsed referral                |
| PATCH  | `/referrals/{id}/status` | update referral status                |
| GET    | `/samples`               | get sample referral texts for testing |
