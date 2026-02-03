
import { AppConfig } from '../types';

export const generatePythonScript = (config: AppConfig): string => {
  const { apiId, apiHash, phoneNumber, targetGroup } = config;

  return `
"""
Telegram Group Member Extractor v1.0
-----------------------------------
Requirements:
1. Python 3.7+
2. pip install telethon

Setup:
1. Get your API_ID and API_HASH from https://my.telegram.org
2. Run this script: python extractor.py
3. Enter the OTP sent to your Telegram app when prompted.
"""

import os
import csv
import asyncio
from telethon.sync import TelegramClient
from telethon.tl.functions.channels import GetParticipantsRequest
from telethon.tl.types import ChannelParticipantsSearch, InputPeerChannel, InputPeerChat
from telethon.errors import FloodWaitError, rpcerrorlist

# --- CONFIGURATION ---
API_ID = ${apiId ? apiId : "0"}  # Your API ID (integer)
API_HASH = '${apiHash || "YOUR_API_HASH"}'
PHONE = '${phoneNumber || "YOUR_PHONE_NUMBER"}'
TARGET_GROUP = '${targetGroup || "group_username_or_link"}'

# --- EXPORT SETTINGS ---
EXPORT_DIR = "exports"
if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)

async def main():
    print("="*50)
    print("      TELEGRAM MEMBER EXTRACTOR PRO             ")
    print("="*50)
    
    if API_ID == 0 or not API_HASH:
        print("[!] Error: Please update API_ID and API_HASH in the script.")
        return

    # Initialize Client
    client = TelegramClient('session_user_extraction', API_ID, API_HASH)
    
    try:
        await client.start(phone=PHONE)
        print("\n[+] Authentication successful!")
        
        # Resolve target entity
        print(f"[*] Accessing target: {TARGET_GROUP}...")
        try:
            entity = await client.get_entity(TARGET_GROUP)
        except Exception as e:
            print(f"[!] Error: Could not find group/channel. Check link/username. ({e})")
            return

        group_name = getattr(entity, 'title', 'telegram_group')
        # Sanitize filename
        clean_name = "".join([c for c in group_name if c.isalnum() or c==' ']).strip().replace(" ", "_")
        
        csv_file = os.path.join(EXPORT_DIR, f"{clean_name}_members.csv")
        vcf_file = os.path.join(EXPORT_DIR, f"{clean_name}_contacts.vcf")
        
        all_participants = []
        offset = 0
        limit = 100
        
        print(f"[*] Extracting members from: {group_name}")
        print("[*] Using 1s delay to respect rate limits...")

        while True:
            try:
                participants = await client(GetParticipantsRequest(
                    entity, ChannelParticipantsSearch(''), offset, limit, hash=0
                ))
            except FloodWaitError as e:
                print(f"\n[!] Rate limited! FloodWait: Waiting {e.seconds} seconds...")
                await asyncio.sleep(e.seconds)
                continue
            except rpcerrorlist.ChatAdminRequiredError:
                print("\n[!] Error: You need admin rights or the group settings prevent member listing.")
                break
                
            if not participants.users:
                break
                
            all_participants.extend(participants.users)
            offset += len(participants.users)
            print(f"    -> Progress: {offset} members identified...", end='\r')
            
            # Rate limit protection
            await asyncio.sleep(1.2) 
            
        print(f"\n[+] Extraction complete. {len(all_participants)} total members found.")
        
        # Data Export
        print("[*] Writing files to /exports folder...")
        
        with open(csv_file, 'w', encoding='utf-8', newline='') as f_csv, \
             open(vcf_file, 'w', encoding='utf-8') as f_vcf:
            
            writer = csv.writer(f_csv)
            writer.writerow(['User ID', 'Username', 'First Name', 'Last Name', 'Phone'])
            
            vcf_count = 0
            for user in all_participants:
                uid = user.id
                username = user.username or ""
                first_name = user.first_name or ""
                last_name = user.last_name or ""
                phone = user.phone or ""
                
                # CSV Export
                writer.writerow([uid, username, first_name, last_name, phone])
                
                # vCard Export (Only if phone available)
                if phone:
                    f_vcf.write("BEGIN:VCARD\n")
                    f_vcf.write("VERSION:3.0\n")
                    f_vcf.write(f"N:{last_name};{first_name};;;\n")
                    f_vcf.write(f"FN:{first_name} {last_name}\n")
                    f_vcf.write(f"TEL;TYPE=CELL:+{phone}\n")
                    f_vcf.write(f"X-TELEGRAM-ID:{uid}\n")
                    f_vcf.write("END:VCARD\n")
                    vcf_count += 1
            
        print(f"[SUCCESS] CSV Data: {csv_file}")
        print(f"[SUCCESS] vCard Data: {vcf_file} ({vcf_count} contacts with phones)")
        
    except KeyboardInterrupt:
        print("\n[!] Stopped by user.")
    except Exception as e:
        print(f"\n[CRITICAL ERROR] {str(e)}")
    finally:
        await client.disconnect()
        print("[*] Session closed.")

if __name__ == "__main__":
    asyncio.run(main())
`.trim();
};
