$env:FILTER_BRANCH_SQUELCH_WARNING = 1

$envContent = @"
PORT=3300
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=travel_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7200
REFRESH_EXPIRES_IN=604800
REDIS_HOST=localhost
REDIS_PORT=6379
UPLOAD_PATH=./uploads
ALI_ACCESS_KEY_ID=your_ali_access_key_id
ALI_ACCESS_KEY_SECRET=your_ali_access_key_secret
ALI_SMS_SIGN_NAME=your_sms_sign_name
ALI_SMS_TEMPLATE_CODE=your_sms_template_code
MODEL_PROVIDER=QwenPlus
QwenPlus_API_KEY=your_qwen_api_key
QwenPlus_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QwenPlus_MODEL=qwen3.6-flash
"@

Write-Host $envContent | Out-File -FilePath "travel-server/.env.example" -Encoding utf8

git filter-branch --force --tree-filter 'powershell -Command "Get-Content clean_history.ps1 -Tail 17 | Out-File travel-server/.env.example -Encoding utf8"' -- --all