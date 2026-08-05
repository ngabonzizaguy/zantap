Add-Type -AssemblyName System.Drawing
Get-ChildItem 'public/brand/approved-z/*.png' | ForEach-Object {
  $bmp = [System.Drawing.Bitmap]::FromFile($_.FullName)
  $minX = $bmp.Width; $minY = $bmp.Height; $maxX = 0; $maxY = 0
  $opaque = 0; $rSum = [long]0; $gSum = [long]0; $bSum = [long]0
  $dark = 0; $light = 0; $amber = 0
  $step = [Math]::Max(1, [int]($bmp.Width / 128))
  for ($y = 0; $y -lt $bmp.Height; $y += $step) {
    for ($x = 0; $x -lt $bmp.Width; $x += $step) {
      $p = $bmp.GetPixel($x, $y)
      if ($p.A -gt 16) {
        $opaque++
        $rSum += $p.R; $gSum += $p.G; $bSum += $p.B
        $lum = (0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B)
        if ($lum -lt 60) { $dark++ } elseif ($lum -gt 200) { $light++ }
        if ($p.R -gt 180 -and $p.G -gt 100 -and $p.G -lt 200 -and $p.B -lt 100) { $amber++ }
        if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  $sampled = [Math]::Ceiling($bmp.Width / $step) * [Math]::Ceiling($bmp.Height / $step)
  if ($opaque -gt 0) {
    $avgR = [int]($rSum / $opaque); $avgG = [int]($gSum / $opaque); $avgB = [int]($bSum / $opaque)
    $pctDark = [int](100 * $dark / $opaque); $pctLight = [int](100 * $light / $opaque); $pctAmber = [int](100 * $amber / $opaque)
  } else { $avgR = 0; $avgG = 0; $avgB = 0; $pctDark = 0; $pctLight = 0; $pctAmber = 0 }
  $bw = $maxX - $minX; $bh = $maxY - $minY
  Write-Host ("{0}  {1}x{2}  bbox=({3},{4})-({5},{6}) [{7}x{8}]  fill={9}%  avgRGB=({10},{11},{12})  dark={13}% light={14}% amber={15}%" -f $_.Name, $bmp.Width, $bmp.Height, $minX, $minY, $maxX, $maxY, $bw, $bh, [int](100 * $opaque / $sampled), $avgR, $avgG, $avgB, $pctDark, $pctLight, $pctAmber)
  $bmp.Dispose()
}
