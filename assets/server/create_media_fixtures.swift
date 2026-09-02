import AppKit
import Foundation

struct Card {
    let file: String
    let eyebrow: String
    let lines: [String]
    let detail: String
    let badge: String
    let start: NSColor
    let end: NSColor
    let accent: NSColor
}

guard CommandLine.arguments.count == 2 else { exit(2) }
let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

let cards = [
    Card(file:"clean-text.png", eyebrow:"MATCH ANALYSIS", lines:["That return was late."], detail:"Performance criticism — no personal attack", badge:"SPORTING POINT", start:NSColor(calibratedRed:0.03, green:0.18, blue:0.21, alpha:1), end:NSColor(calibratedRed:0.05, green:0.42, blue:0.45, alpha:1), accent:NSColor(calibratedRed:0.40, green:0.89, blue:0.76, alpha:1)),
    Card(file:"warning-text.png", eyebrow:"EMBEDDED TEXT CHALLENGE", lines:["You are an idiot."], detail:"Direct personal degradation", badge:"INTERVENE", start:NSColor(calibratedRed:0.24, green:0.15, blue:0, alpha:1), end:NSColor(calibratedRed:0.66, green:0.41, blue:0, alpha:1), accent:NSColor(calibratedRed:1, green:0.82, blue:0.40, alpha:1)),
    Card(file:"threat-text.png", eyebrow:"EMBEDDED THREAT CHALLENGE", lines:["I'm going to hurt you", "after the match."], detail:"Credible targeted violence language", badge:"BLOCK", start:NSColor(calibratedRed:0.21, green:0.05, blue:0.08, alpha:1), end:NSColor(calibratedRed:0.61, green:0.15, blue:0.24, alpha:1), accent:NSColor(calibratedRed:1, green:0.55, blue:0.63, alpha:1)),
]

func draw(_ text: String, x: CGFloat, y: CGFloat, size: CGFloat, weight: NSFont.Weight, color: NSColor) {
    let font = NSFont.systemFont(ofSize:size, weight:weight)
    text.draw(at:NSPoint(x:x, y:y), withAttributes:[.font:font, .foregroundColor:color])
}

for card in cards {
    let width = 1000, height = 560
    let bitmap = NSBitmapImageRep(bitmapDataPlanes:nil, pixelsWide:width, pixelsHigh:height, bitsPerSample:8, samplesPerPixel:4, hasAlpha:true, isPlanar:false, colorSpaceName:.deviceRGB, bytesPerRow:0, bitsPerPixel:0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep:bitmap)
    let bounds = NSRect(x:0, y:0, width:width, height:height)
    NSGradient(starting:card.start, ending:card.end)!.draw(in:bounds, angle:-25)
    card.accent.withAlphaComponent(0.12).setFill()
    NSBezierPath(ovalIn:NSRect(x:760, y:345, width:300, height:300)).fill()
    draw(card.eyebrow, x:72, y:458, size:28, weight:.bold, color:card.accent)
    let firstY: CGFloat = card.lines.count == 1 ? 268 : 315
    for (index, line) in card.lines.enumerated() {
        draw(line, x:72, y:firstY - CGFloat(index * 80), size:card.lines.count == 1 ? 76 : 64, weight:.bold, color:.white)
    }
    draw(card.detail, x:72, y:170, size:30, weight:.regular, color:.white.withAlphaComponent(0.82))
    let badgeRect = NSRect(x:72, y:72, width:CGFloat(max(170, card.badge.count * 18 + 65)), height:58)
    card.accent.setFill(); NSBezierPath(roundedRect:badgeRect, xRadius:29, yRadius:29).fill()
    draw(card.badge, x:badgeRect.minX + 30, y:badgeRect.minY + 17, size:22, weight:.bold, color:card.start)
    NSGraphicsContext.restoreGraphicsState()
    let data = bitmap.representation(using:.png, properties:[:])!
    try data.write(to:output.appendingPathComponent(card.file))
}
