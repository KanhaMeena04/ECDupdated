$ErrorActionPreference = "Stop"

# Resolve the actual PowerShell project directory first.
$base = (Get-Location).Path

if (!(Test-Path (Join-Path $base "pubspec.yaml"))) {
    throw "pubspec.yaml nahi mila. Pehle Flutter user project ke root mein jao."
}

$files = @{
    Register = Join-Path $base "lib\pages\auth\register_page.dart"
    Cart     = Join-Path $base "lib\pages\food_delivery\restaurant_detail_screen.dart"
    Payment  = Join-Path $base "lib\pages\payment\review_pay_page.dart"
    Service  = Join-Path $base "lib\services\meta_app_events_service.dart"
}

foreach ($entry in $files.GetEnumerator()) {
    if (!(Test-Path -LiteralPath $entry.Value)) {
        throw "File missing: $($entry.Value). Dart files modify nahi ki gayi."
    }
}

function Normalize([string]$Text) {
    return ($Text -replace "`r`n|`r", "`n")
}

function Replace-LiteralOnce(
    [string]$Text,
    [string]$Old,
    [string]$New,
    [string]$Label
) {
    $first = $Text.IndexOf($Old, [StringComparison]::Ordinal)

    if ($first -lt 0) {
        throw "$Label anchor nahi mila. Koi Dart file save nahi ki gayi."
    }

    $second = $Text.IndexOf(
        $Old,
        $first + $Old.Length,
        [StringComparison]::Ordinal
    )

    if ($second -ge 0) {
        throw "$Label anchor multiple baar mila. Koi Dart file save nahi ki gayi."
    }

    return $Text.Substring(0, $first) +
           $New +
           $Text.Substring($first + $Old.Length)
}

function Ensure-Import(
    [string]$Text,
    [string]$Import,
    [string]$Anchor,
    [string]$Label
) {
    if ($Text.Contains($Import)) {
        return $Text
    }

    return Replace-LiteralOnce `
        $Text `
        $Anchor `
        ($Anchor + "`n" + $Import) `
        $Label
}

function Replace-RegexOnce(
    [string]$Text,
    [string]$Pattern,
    [string]$Replacement,
    [string]$Label
) {
    $found = [regex]::Matches($Text, $Pattern)

    if ($found.Count -ne 1) {
        throw "${Label}: expected 1 match, found $($found.Count). Koi Dart file save nahi ki gayi."
    }

    $m = $found[0]

    return $Text.Substring(0, $m.Index) +
           $Replacement +
           $Text.Substring($m.Index + $m.Length)
}

# Read absolute paths, never use GetFullPath() on relative paths.
$rRaw = [System.IO.File]::ReadAllText($files.Register)
$cRaw = [System.IO.File]::ReadAllText($files.Cart)
$pRaw = [System.IO.File]::ReadAllText($files.Payment)
$sRaw = [System.IO.File]::ReadAllText($files.Service)

$rOriginal = Normalize $rRaw
$cOriginal = Normalize $cRaw
$pOriginal = Normalize $pRaw

$r = $rOriginal
$c = $cOriginal
$p = $pOriginal
$s = Normalize $sRaw

# Verify the service class and methods before adding calls.
foreach ($method in @(
    "registrationCompleted",
    "addToCart",
    "purchase"
)) {
    if (!$s.Contains($method)) {
        throw "Meta service method '$method' missing hai. Pehle service file check karo."
    }
}

$metaImport = "import 'package:ecdkart_app/services/meta_app_events_service.dart';"

# Imports are added only when missing.
$r = Ensure-Import $r $metaImport `
    "import 'package:ecdkart_app/routes/app_routes.dart';" `
    "Registration import"

$c = Ensure-Import $c $metaImport `
    "import 'restaurant_profile_screen.dart';" `
    "Cart import"

$p = Ensure-Import $p $metaImport `
    "import '../../widgets/flip_animation_widgets.dart';" `
    "Payment import"

if (!$p.Contains("import 'dart:async';")) {
    $p = Replace-LiteralOnce $p `
        "import 'dart:ui';" `
        "import 'dart:async';`nimport 'dart:ui';" `
        "Payment async import"
}

# 1. Registration: phone already verified, profile update result is available.
if (!$r.Contains("// META_EVENT_REGISTER_PROFILE_UPDATE")) {
    $pattern = '(?m)^([ \t]*)final updateSuccess = await UserApiService\.updateProfile\(\s*fullName,\s*email:\s*email,\s*phone:\s*mobile\s*\);'
    $m = [regex]::Matches($r, $pattern)

    if ($m.Count -ne 1) {
        throw "Verified-phone profile-update anchor expected once, found $($m.Count)."
    }

    $match = $m[0]
    $indent = $match.Groups[1].Value

    $replacement = $match.Value + "`n" +
        $indent + "// META_EVENT_REGISTER_PROFILE_UPDATE" + "`n" +
        $indent + "if (updateSuccess) {" + "`n" +
        $indent + "  unawaited(MetaAppEventsService.registrationCompleted());" + "`n" +
        $indent + "}"

    $r = $r.Remove($match.Index, $match.Length).Insert($match.Index, $replacement)
}

# 2. Registration: successful OTP flow.
if (!$r.Contains("// META_EVENT_REGISTER_OTP_PROFILE")) {
    $pattern = '(?m)^([ \t]*)await UserApiService\.updateProfile\(\s*fullName,\s*email:\s*email,\s*phone:\s*mobile\s*\);'
    $m = [regex]::Matches($r, $pattern)

    if ($m.Count -ne 1) {
        throw "OTP profile-update anchor expected once, found $($m.Count)."
    }

    $match = $m[0]
    $indent = $match.Groups[1].Value

    $replacement = $match.Value + "`n" +
        $indent + "// META_EVENT_REGISTER_OTP_PROFILE" + "`n" +
        $indent + "unawaited(MetaAppEventsService.registrationCompleted());"

    $r = $r.Remove($match.Index, $match.Length).Insert($match.Index, $replacement)
}

# 3. Add-to-cart: restaurant-switch confirmation path.
if (!$c.Contains("// META_EVENT_CART_SWITCH_RESTAURANT")) {
    $pattern = '(?s)([ \t]*)cartProvider\.switchRestaurantAndAdd\(\s*product,\s*restaurantId:\s*restaurantId,\s*restaurantName:\s*restaurantName,\s*restaurantImageUrl:\s*restaurantImageUrl,\s*restaurantAddress:\s*restaurantAddress,\s*deliveryTimeMin:\s*deliveryTimeMin,\s*minOrderValue:\s*minOrderValue,\s*imageUrl:\s*item\.imageUrl,\s*baseProductId:\s*item\.id,\s*portion:\s*portion,\s*portionName:\s*portionName,\s*addOns:\s*addOns,\s*\);'
    $m = [regex]::Matches($c, $pattern)

    if ($m.Count -ne 1) {
        throw "Switch-restaurant cart anchor expected once, found $($m.Count)."
    }

    $match = $m[0]
    $indent = $match.Groups[1].Value

    $event = "`n" +
        $indent + "// META_EVENT_CART_SWITCH_RESTAURANT" + "`n" +
        $indent + "unawaited(" + "`n" +
        $indent + "  MetaAppEventsService.addToCart(" + "`n" +
        $indent + "    itemId: product.id," + "`n" +
        $indent + "    price: product.price.toDouble()," + "`n" +
        $indent + "  )," + "`n" +
        $indent + ");"

    $c = $c.Remove($match.Index, $match.Length).Insert(
        $match.Index,
        $match.Value + $event
    )
}

# 4. Add-to-cart: normal add path.
if (!$c.Contains("// META_EVENT_CART_NORMAL_ADD")) {
    $pattern = '(?s)([ \t]*)cartProvider\.addItem\(\s*product,\s*restaurantId:\s*restaurantId,\s*restaurantName:\s*restaurantName,\s*restaurantImageUrl:\s*restaurantImageUrl,\s*restaurantAddress:\s*restaurantAddress,\s*deliveryTimeMin:\s*deliveryTimeMin,\s*minOrderValue:\s*minOrderValue,\s*imageUrl:\s*item\.imageUrl,\s*baseProductId:\s*item\.id,\s*portion:\s*portion,\s*portionName:\s*portionName,\s*addOns:\s*addOns,\s*\);'
    $m = [regex]::Matches($c, $pattern)

    if ($m.Count -ne 1) {
        throw "Normal cart-add anchor expected once, found $($m.Count)."
    }

    $match = $m[0]
    $indent = $match.Groups[1].Value

    $event = "`n" +
        $indent + "// META_EVENT_CART_NORMAL_ADD" + "`n" +
        $indent + "unawaited(" + "`n" +
        $indent + "  MetaAppEventsService.addToCart(" + "`n" +
        $indent + "    itemId: product.id," + "`n" +
        $indent + "    price: product.price.toDouble()," + "`n" +
        $indent + "  )," + "`n" +
        $indent + ");"

    $c = $c.Remove($match.Index, $match.Length).Insert(
        $match.Index,
        $match.Value + $event
    )
}

# 5. Purchase event before cart.clear() in the shared order-success handler.
if (!$p.Contains("// META_EVENT_PURCHASE_ORDER_SUCCESS")) {
    $oldLines = @(
        "    final cartItems = cart.items",
        "        .map((i) => ({",
        "              'name': i.product.name,",
        "              'qty': i.quantity,",
        "              'subtotal': i.totalPrice,",
        "            }))",
        "        .toList();",
        "",
        "    cart.clear();"
    )

    $newLines = @(
        "    final cartItems = cart.items",
        "        .map((i) => ({",
        "              'name': i.product.name,",
        "              'qty': i.quantity,",
        "              'subtotal': i.totalPrice,",
        "            }))",
        "        .toList();",
        "",
        "    // META_EVENT_PURCHASE_ORDER_SUCCESS",
        "    unawaited(",
        "      MetaAppEventsService.purchase(",
        "        amount: cart.finalAmount.toDouble(),",
        "      ),",
        "    );",
        "",
        "    cart.clear();"
    )

    $p = Replace-LiteralOnce $p `
        ($oldLines -join "`n") `
        ($newLines -join "`n") `
        "Successful-order purchase event"
}

# Prepare every file before saving anything.
$changes = @(
    [pscustomobject]@{ Path = $files.Register; Original = $rOriginal; Text = $r }
    [pscustomobject]@{ Path = $files.Cart; Original = $cOriginal; Text = $c }
    [pscustomobject]@{ Path = $files.Payment; Original = $pOriginal; Text = $p }
)

# Save only after all anchors passed validation.
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($change in $changes) {
    if ($change.Text -ne $change.Original) {
        Copy-Item -LiteralPath $change.Path -Destination "$($change.Path).backup-meta-$stamp"
        [System.IO.File]::WriteAllText($change.Path, $change.Text, $utf8)
        Write-Host "Updated: $($change.Path)" -ForegroundColor Green
    } else {
        Write-Host "No change needed: $($change.Path)" -ForegroundColor Yellow
    }
}

Write-Host "`nPATCH APPLIED. Check markers and run flutter analyze next." -ForegroundColor Cyan
