#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大業 AI 繪圖社｜觀眾投票抽獎 + 通知範本產生器

用途：6/20 開獎當天從觀眾投票試算表撈出「猜對人氣金獎」的人，
      隨機抽 N 名得獎人，並印出 Gmail 通知範本讓 KIRIN 複製寄信。

設計原則（零依賴）：
- 只用 Python 標準庫，不需要 pip install
- 不直接寄信（避免 OAuth 設定麻煩）
- 印出範本給 KIRIN 親自貼到 Gmail 寄出
- 保護隱私：不公開姓名、不公開名單

使用方式：
  1. 6/20 早上到 Google 試算表
     檔案 → 下載 → 逗點分隔值（.csv）→ 存到桌面
  2. cd ~/Documents/New\\ project/daye-ai-exhibition-pages-public
  3. 跑指令：
     python3 forms/lottery_draw.py ~/Desktop/votes.csv "G07 深淵騎士" 3
                                    ↑ CSV 路徑           ↑ 人氣冠軍   ↑ 抽幾名

  4. 程式會印出：
     - 答對人氣金獎的所有人 Gmail（淘汰未中獎用）
     - 隨機抽出的 N 名得獎人
     - Gmail 通知範本（你複製貼到 Gmail 寄）

範例輸出：
  ============================================================
  📊 投票統計
  ============================================================
  總投票人數：87 人
  猜對人氣金獎（G07 深淵騎士）：23 人
  ============================================================
  🎲 隨機抽出 3 名得獎人
  ============================================================
  🎉 中獎人 1：student1@gmail.com
  🎉 中獎人 2：student2@gmail.com
  🎉 中獎人 3：student3@gmail.com
  ============================================================
  📧 Gmail 通知範本（複製貼上即可）
  ============================================================
  ...
"""

import csv
import random
import sys
from pathlib import Path


def find_column(headers: list, keywords: list) -> int:
    """從表頭找出對應的欄位 index"""
    for idx, h in enumerate(headers):
        h_str = str(h).strip()
        for kw in keywords:
            if kw in h_str:
                return idx
    return -1


def main():
    if len(sys.argv) < 3:
        print("❌ 用法：python3 lottery_draw.py <CSV 路徑> <人氣金獎答案> [抽幾名=3]")
        print("   範例：python3 lottery_draw.py ~/Desktop/votes.csv 'G07 深淵騎士' 3")
        sys.exit(1)

    csv_path = Path(sys.argv[1]).expanduser()
    winning_answer = sys.argv[2].strip()
    pick_count = int(sys.argv[3]) if len(sys.argv) >= 4 else 3

    if not csv_path.exists():
        print(f"❌ 找不到 CSV：{csv_path}")
        print("   提示：先去 Google 試算表 → 檔案 → 下載 → .csv → 存桌面")
        sys.exit(1)

    # 讀 CSV
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if len(rows) < 2:
        print("⚠️ CSV 沒有資料")
        sys.exit(1)

    headers = rows[0]
    data_rows = rows[1:]

    # 找關鍵欄位
    email_col = find_column(headers, ["電子郵件", "Email", "email"])
    predict_col = find_column(headers, ["猜誰", "人氣金獎", "預測"])

    if email_col < 0:
        print("❌ CSV 找不到「電子郵件」欄位")
        sys.exit(1)
    if predict_col < 0:
        print("❌ CSV 找不到「猜誰得人氣金獎」欄位")
        print("   表頭欄位：", headers)
        sys.exit(1)

    # 找猜對的人
    correct_emails = []
    for row in data_rows:
        if predict_col >= len(row) or email_col >= len(row):
            continue
        predicted = str(row[predict_col]).strip()
        email = str(row[email_col]).strip()
        if predicted == winning_answer and email:
            correct_emails.append(email)

    # 去重
    correct_emails = list(set(correct_emails))

    print("=" * 60)
    print("📊 投票統計")
    print("=" * 60)
    print(f"總投票人數：{len(data_rows)} 人")
    print(f"人氣金獎答案：{winning_answer}")
    print(f"猜對人氣金獎：{len(correct_emails)} 人")
    print("=" * 60)

    if not correct_emails:
        print("⚠️ 沒有人猜對 — 從缺")
        sys.exit(0)

    actual_pick = min(pick_count, len(correct_emails))
    if actual_pick < pick_count:
        print(f"⚠️ 猜對人數 {len(correct_emails)} < 預期抽出 {pick_count}")
        print(f"   實際抽出 {actual_pick} 名")

    winners = random.sample(correct_emails, actual_pick)

    print(f"\n🎲 隨機抽出 {actual_pick} 名得獎人")
    print("=" * 60)
    for i, email in enumerate(winners, 1):
        print(f"🎉 中獎人 {i}：{email}")
    print("=" * 60)

    # Gmail 通知範本
    print("\n📧 Gmail 通知範本（複製貼上即可）")
    print("=" * 60)
    for i, email in enumerate(winners, 1):
        print(f"\n--- 第 {i} 封 ---")
        print(f"收件人：{email}")
        print(f"主旨：🎉 大業 AI 繪圖社成果展｜恭喜你猜對人氣金獎！")
        print(f"內文：")
        print(f"""
您好，

感謝你參與大業 AI 繪圖社 2026 學期末成果展的觀眾投票！

你猜對人氣金獎的得主是「{winning_answer}」，
經過隨機抽獎，你是 {actual_pick} 位幸運觀眾之一 🎁

獎品領取方式：
（KIRIN 在這裡填上獎品內容跟領取方式）

再次感謝你的支持！
你的眼光讓學生的努力被看見。

大業 AI 繪圖社｜指導老師 KIRIN
2026/6/20
""")
    print("=" * 60)
    print("✅ 完成！把上方範本複製到 Gmail 一封一封寄出")
    print("   隱私保護：不公開名單，只私訊得獎人")


if __name__ == "__main__":
    main()
