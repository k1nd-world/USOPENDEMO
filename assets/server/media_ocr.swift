import AppKit
import Foundation
import Vision

func emit(_ payload: [String: Any], exitCode: Int32 = 0) -> Never {
    let data = try! JSONSerialization.data(withJSONObject: payload, options: [])
    FileHandle.standardOutput.write(data)
    exit(exitCode)
}

guard CommandLine.arguments.count == 2 else {
    emit(["ok": false, "error": "Expected one image path"], exitCode: 2)
}

let path = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: path) else {
    emit(["ok": false, "error": "The image could not be decoded"], exitCode: 3)
}

var proposed = NSRect(origin: .zero, size: image.size)
guard let cgImage = image.cgImage(forProposedRect: &proposed, context: nil, hints: nil) else {
    emit(["ok": false, "error": "The image could not be converted for OCR"], exitCode: 4)
}

let textRequest = VNRecognizeTextRequest()
textRequest.recognitionLevel = .accurate
textRequest.usesLanguageCorrection = true
textRequest.minimumTextHeight = 0.012
let classificationRequest = VNClassifyImageRequest()

do {
    try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([textRequest, classificationRequest])
    let observations = textRequest.results ?? []
    let rows: [[String: Any]] = observations.compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        return [
            "text": candidate.string,
            "confidence": Double(candidate.confidence),
            "box": [
                "x": Double(observation.boundingBox.origin.x),
                "y": Double(observation.boundingBox.origin.y),
                "width": Double(observation.boundingBox.width),
                "height": Double(observation.boundingBox.height),
            ],
        ]
    }
    let text = rows.compactMap { $0["text"] as? String }.joined(separator: "\n")
    let confidences = rows.compactMap { $0["confidence"] as? Double }
    let mean = confidences.isEmpty ? 0.0 : confidences.reduce(0, +) / Double(confidences.count)
    let classifications: [[String: Any]] = (classificationRequest.results ?? []).prefix(20).map { item in
        ["label": item.identifier, "confidence": Double(item.confidence)]
    }
    emit([
        "ok": true,
        "engine": "Apple Vision on-device OCR",
        "width": cgImage.width,
        "height": cgImage.height,
        "text": text,
        "confidence": mean,
        "observations": rows,
        "visualOk": true,
        "visualEngine": "Apple Vision VNClassifyImageRequest",
        "classifications": classifications,
    ])
} catch {
    emit(["ok": false, "error": error.localizedDescription], exitCode: 5)
}
