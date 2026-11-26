// Renders page 1 of a PDF to a PNG at a given scale. Usage: swift render-pdf.swift in.pdf out.png 3
import PDFKit
import AppKit
let a = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: a[1]))!
let page = doc.page(at: 0)!
let s = CGFloat(Double(a[3]) ?? 3)
let b = page.bounds(for: .mediaBox)
let size = NSSize(width: b.width * s, height: b.height * s)
let img = NSImage(size: size)
img.lockFocus()
NSColor.white.set(); NSRect(origin: .zero, size: size).fill()
let ctx = NSGraphicsContext.current!.cgContext
ctx.scaleBy(x: s, y: s)
page.draw(with: .mediaBox, to: ctx)
img.unlockFocus()
let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
