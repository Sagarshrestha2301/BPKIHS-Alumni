$ErrorActionPreference = 'Stop'
$inputPath = (Resolve-Path 'BPKIHS Alumni Association User Manual.docx').Path
$outputDir = (Resolve-Path '.').Path
$pdfPath = Join-Path $outputDir 'BPKIHS Alumni Association User Manual.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $document = $word.Documents.Open($inputPath, $false, $true)
  try {
    $document.ExportAsFixedFormat($pdfPath, 17)
  }
  finally {
    $document.Close()
  }
}
finally {
  $word.Quit()
}
