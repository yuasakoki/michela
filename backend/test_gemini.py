import google.generativeai as genai

genai.configure(api_key='AIzaSyDrouM4zNZD9zqlUw6Af5Zlp_T4T61cggw')

print("Available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"  {m.name}")
