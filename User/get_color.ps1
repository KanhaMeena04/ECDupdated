Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("C:\Users\samya\.gemini\antigravity-ide\brain\ec31bad6-074a-435e-bb07-e64192a45121\.user_uploaded\media_1788515110813.png")
$c = $bmp.GetPixel(50, 50)
Write-Host "$($c.R.ToString('X2'))$($c.G.ToString('X2'))$($c.B.ToString('X2'))"
