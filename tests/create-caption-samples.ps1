$ErrorActionPreference = 'Stop'
$taskMediaRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'dist/media'
$taskBuildRoot = Join-Path $PSScriptRoot 'caption-build'
New-Item -ItemType Directory -Force -Path $taskMediaRoot, $taskBuildRoot | Out-Null
$taskFFmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$taskNatureSource = Join-Path $taskBuildRoot 'flower.mp4'
if (!(Test-Path -LiteralPath $taskNatureSource)) {
    Invoke-WebRequest -Uri 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' -OutFile $taskNatureSource
}

Add-Type -AssemblyName System.Speech
$taskSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $taskSynth.SelectVoice('Microsoft Zira Desktop')
    $taskSynth.Rate = 0
    $taskPhrases = @(
        'This video has spoken narration.',
        'Turn on closed captions to see these words.',
        'Turn captions off to hide the subtitles.'
    )
    for ($taskIndex = 0; $taskIndex -lt $taskPhrases.Count; $taskIndex++) {
        $taskSynth.SetOutputToWaveFile((Join-Path $taskBuildRoot "speech-$taskIndex.wav"))
        $taskSynth.Speak($taskPhrases[$taskIndex])
        $taskSynth.SetOutputToNull()
    }
} finally { $taskSynth.Dispose() }

$taskSpeech0 = Join-Path $taskBuildRoot 'speech-0.wav'
$taskSpeech1 = Join-Path $taskBuildRoot 'speech-1.wav'
$taskSpeech2 = Join-Path $taskBuildRoot 'speech-2.wav'

# Local nature clip with three spoken passages at 0, 5, and 10 seconds.
& $taskFFmpeg -y -hide_banner -loglevel error -stream_loop -1 -i $taskNatureSource -i $taskSpeech0 -i $taskSpeech1 -i $taskSpeech2 `
    -filter_complex '[1:a]adelay=0:all=1[a0];[2:a]adelay=5000:all=1[a1];[3:a]adelay=10000:all=1[a2];[a0][a1][a2]amix=inputs=3:normalize=0,apad[a]' `
    -map 0:v:0 -map '[a]' -t 16 -vf 'scale=640:-2' -c:v libx264 -preset fast -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart (Join-Path $taskMediaRoot 'spoken.mp4')
if ($LASTEXITCODE -ne 0) { throw 'Spoken video generation failed.' }

# Deliberately contains no audio stream, rather than just being muted.
& $taskFFmpeg -y -hide_banner -loglevel error -stream_loop -1 -i $taskNatureSource -t 10 -an -vf 'scale=640:-2' `
    -c:v libx264 -preset fast -crf 24 -pix_fmt yuv420p -movflags +faststart (Join-Path $taskMediaRoot 'silent.mp4')
if ($LASTEXITCODE -ne 0) { throw 'Silent video generation failed.' }

# Spoken introduction, a quiet observation interval, then spoken ending.
& $taskFFmpeg -y -hide_banner -loglevel error -stream_loop -1 -i $taskNatureSource -i $taskSpeech0 -i $taskSpeech2 `
    -filter_complex '[1:a]adelay=0:all=1[a0];[2:a]adelay=12000:all=1[a1];[a0][a1]amix=inputs=2:normalize=0,apad[a]' `
    -map 0:v:0 -map '[a]' -t 18 -vf 'scale=640:-2' -c:v libx264 -preset fast -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart (Join-Path $taskMediaRoot 'mixed.mp4')
if ($LASTEXITCODE -ne 0) { throw 'Mixed video generation failed.' }

Write-Output 'Generated spoken.mp4, silent.mp4, and mixed.mp4.'
