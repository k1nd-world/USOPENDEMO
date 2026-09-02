import AppKit
import CoreImage
import Foundation

guard CommandLine.arguments.count == 2,
      let payload = CommandLine.arguments[1].data(using: .utf8),
      let filter = CIFilter(name: "CIQRCodeGenerator") else {
    fputs("QR payload is required\n", stderr)
    exit(2)
}

filter.setValue(payload, forKey: "inputMessage")
filter.setValue("M", forKey: "inputCorrectionLevel")

guard let output = filter.outputImage?.transformed(by: CGAffineTransform(scaleX: 10, y: 10)) else {
    fputs("QR image generation failed\n", stderr)
    exit(3)
}

let representation = NSBitmapImageRep(ciImage: output)
guard let png = representation.representation(using: .png, properties: [:]) else {
    fputs("QR PNG encoding failed\n", stderr)
    exit(4)
}

FileHandle.standardOutput.write(png)
