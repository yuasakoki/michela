import requests
from datetime import datetime, timedelta
import json

# APIのベースURL
API_URL = "https://michela.onrender.com"
# API_URL = "http://localhost:5000"  # ローカル環境の場合

# テストさんのID
CUSTOMER_ID = "uk5doESFqdFYzjc6V7xJ"

def create_test_data():
    print("🚀 テストデータ作成開始\n")
    
    # 過去5日分の日付を生成
    today = datetime(2026, 1, 4)
    dates = [(today - timedelta(days=i)) for i in range(5)]
    dates.reverse()  # 古い順にソート
    
    print(f"📅 対象期間: {dates[0].strftime('%Y-%m-%d')} ~ {dates[-1].strftime('%Y-%m-%d')}\n")
    
    # 1. 体重記録を作成
    print("⚖️  体重記録を登録中...")
    base_weight = 75.0
    for i, date in enumerate(dates):
        weight = base_weight - (i * 0.3)  # 徐々に減少
        data = {
            "weight": weight,
            "recorded_at": date.strftime("%Y-%m-%d"),
            "note": f"{i+1}日目の体重測定"
        }
        
        response = requests.post(
            f"{API_URL}/add_weight_record/{CUSTOMER_ID}",
            json=data
        )
        
        if response.status_code == 201:
            print(f"  ✅ {date.strftime('%m/%d')}: {weight}kg")
        else:
            print(f"  ❌ {date.strftime('%m/%d')}: エラー - {response.text}")
    
    print()
    
    # 2. トレーニング記録を作成
    print("💪 トレーニング記録を登録中...")
    
    # 種目リスト（実際のプリセットから）
    exercises = [
        {"exercise_id": "bench-press", "exercise_name": "ベンチプレス"},
        {"exercise_id": "squat", "exercise_name": "スクワット"},
        {"exercise_id": "deadlift", "exercise_name": "デッドリフト"},
        {"exercise_id": "pull-up", "exercise_name": "懸垂"},
        {"exercise_id": "shoulder-press", "exercise_name": "ショルダープレス"}
    ]
    
    # 1日目と3日目と5日目にトレーニング（週3回程度）
    training_days = [0, 2, 4]
    
    for day_index in training_days:
        date = dates[day_index]
        
        # その日のトレーニング種目（2-3種目）
        day_exercises = []
        
        if day_index == 0:  # 胸・肩
            day_exercises = [
                {
                    "exercise_id": exercises[0]["exercise_id"],
                    "exercise_name": exercises[0]["exercise_name"],
                    "sets": [
                        {"reps": 10, "weight": 60},
                        {"reps": 8, "weight": 65},
                        {"reps": 6, "weight": 70}
                    ],
                    "notes": "フォーム重視"
                },
                {
                    "exercise_id": exercises[4]["exercise_id"],
                    "exercise_name": exercises[4]["exercise_name"],
                    "sets": [
                        {"reps": 10, "weight": 30},
                        {"reps": 10, "weight": 30},
                        {"reps": 8, "weight": 32.5}
                    ],
                    "notes": ""
                }
            ]
        elif day_index == 2:  # 脚
            day_exercises = [
                {
                    "exercise_id": exercises[1]["exercise_id"],
                    "exercise_name": exercises[1]["exercise_name"],
                    "sets": [
                        {"reps": 10, "weight": 80},
                        {"reps": 10, "weight": 90},
                        {"reps": 8, "weight": 100},
                        {"reps": 6, "weight": 100}
                    ],
                    "notes": "深くしゃがむ"
                }
            ]
        else:  # 背中
            day_exercises = [
                {
                    "exercise_id": exercises[2]["exercise_id"],
                    "exercise_name": exercises[2]["exercise_name"],
                    "sets": [
                        {"reps": 8, "weight": 100},
                        {"reps": 8, "weight": 110},
                        {"reps": 6, "weight": 120}
                    ],
                    "notes": "腰に注意"
                },
                {
                    "exercise_id": exercises[3]["exercise_id"],
                    "exercise_name": exercises[3]["exercise_name"],
                    "sets": [
                        {"reps": 8, "weight": 0},
                        {"reps": 7, "weight": 0},
                        {"reps": 6, "weight": 0}
                    ],
                    "notes": "自重のみ"
                }
            ]
        
        session_data = {
            "customer_id": CUSTOMER_ID,
            "date": date.strftime("%Y-%m-%d"),
            "exercises": day_exercises,
            "duration_minutes": 60,
            "notes": f"{date.strftime('%m/%d')}のトレーニング"
        }
        
        response = requests.post(
            f"{API_URL}/add_training_session",
            json=session_data
        )
        
        if response.status_code == 201:
            exercise_names = ", ".join([e["exercise_name"] for e in day_exercises])
            print(f"  ✅ {date.strftime('%m/%d')}: {exercise_names}")
        else:
            print(f"  ❌ {date.strftime('%m/%d')}: エラー - {response.text}")
    
    print()
    
    # 3. 食事記録を作成
    print("🍽️  食事記録を登録中...")
    
    # 毎日3食分を登録
    meal_types = ["朝食", "昼食", "夕食"]
    
    for date in dates:
        # 朝食
        breakfast = {
            "customer_id": CUSTOMER_ID,
            "date": date.strftime("%Y-%m-%d"),
            "meal_type": "breakfast",
            "foods": [
                {"name": "卵", "amount": 2, "unit": "個", "calories": 140, "protein": 12, "fat": 10, "carbs": 1},
                {"name": "ご飯", "amount": 150, "unit": "g", "calories": 252, "protein": 3.8, "fat": 0.5, "carbs": 55.7},
                {"name": "納豆", "amount": 1, "unit": "パック", "calories": 100, "protein": 8.3, "fat": 5, "carbs": 6.1}
            ],
            "total_calories": 492,
            "total_protein": 24.1,
            "total_fat": 15.5,
            "total_carbs": 62.8,
            "notes": ""
        }
        
        # 昼食
        lunch = {
            "customer_id": CUSTOMER_ID,
            "date": date.strftime("%Y-%m-%d"),
            "meal_type": "lunch",
            "foods": [
                {"name": "鶏むね肉", "amount": 200, "unit": "g", "calories": 216, "protein": 43.6, "fat": 3.8, "carbs": 0},
                {"name": "ブロッコリー", "amount": 100, "unit": "g", "calories": 33, "protein": 4.3, "fat": 0.5, "carbs": 5.2},
                {"name": "玄米", "amount": 150, "unit": "g", "calories": 248, "protein": 4.2, "fat": 1.5, "carbs": 51.3}
            ],
            "total_calories": 497,
            "total_protein": 52.1,
            "total_fat": 5.8,
            "total_carbs": 56.5,
            "notes": ""
        }
        
        # 夕食
        dinner = {
            "customer_id": CUSTOMER_ID,
            "date": date.strftime("%Y-%m-%d"),
            "meal_type": "dinner",
            "foods": [
                {"name": "サーモン", "amount": 150, "unit": "g", "calories": 237, "protein": 31.5, "fat": 12, "carbs": 0},
                {"name": "サラダ", "amount": 150, "unit": "g", "calories": 23, "protein": 1.8, "fat": 0.3, "carbs": 4.4},
                {"name": "さつまいも", "amount": 150, "unit": "g", "calories": 198, "protein": 1.8, "fat": 0.3, "carbs": 46.5}
            ],
            "total_calories": 458,
            "total_protein": 35.1,
            "total_fat": 12.6,
            "total_carbs": 50.9,
            "notes": ""
        }
        
        meals = [breakfast, lunch, dinner]
        
        for i, meal in enumerate(meals):
            response = requests.post(
                f"{API_URL}/add_meal_record",
                json=meal
            )
            
            if response.status_code == 201:
                if i == 0:
                    print(f"  ✅ {date.strftime('%m/%d')}: 朝昼晩の3食を登録")
            else:
                print(f"  ❌ {date.strftime('%m/%d')} {meal_types[i]}: エラー - {response.text}")
                break
    
    print("\n✨ テストデータの作成が完了しました！")
    print("\n📊 登録されたデータ:")
    print(f"  - 体重記録: {len(dates)}件")
    print(f"  - トレーニング記録: {len(training_days)}件")
    print(f"  - 食事記録: {len(dates) * 3}件")
    print(f"\n👉 http://localhost:3000/customer/{CUSTOMER_ID} で確認してください")

if __name__ == "__main__":
    create_test_data()
