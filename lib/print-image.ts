import html2canvas from "html2canvas-pro"

/**
 * Renders a DOM element as an image and prints it via a temporary iframe.
 * This ensures custom fonts (e.g. Poppins) are rasterized and printed
 * exactly as displayed, which thermal printers (XP80-T) can't do with raw HTML.
 */
export async function printElementAsImage(
  element: HTMLElement,
  options?: { width?: number }
): Promise<void> {
  // Make the element visible off-screen so html2canvas can capture it
  const prev = {
    display: element.style.display,
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    visibility: element.style.visibility,
  }
  element.style.display = "block"
  element.style.position = "fixed"
  element.style.left = "-9999px"
  element.style.top = "0"
  element.style.visibility = "visible"

  // Wait a tick for fonts/styles to settle
  await new Promise((r) => setTimeout(r, 100))

  const canvas = await html2canvas(element, {
    scale: 2, // Higher resolution for sharp text on thermal paper
    useCORS: true,
    backgroundColor: "#ffffff",
    width: options?.width,
  })

  // Restore original styles
  element.style.display = prev.display
  element.style.position = prev.position
  element.style.left = prev.left
  element.style.top = prev.top
  element.style.visibility = prev.visibility

  // Print via a temporary iframe to avoid disrupting the main page
  const dataUrl = canvas.toDataURL("image/png")
  const printFrame = document.createElement("iframe")
  printFrame.style.position = "fixed"
  printFrame.style.left = "-9999px"
  printFrame.style.width = "0"
  printFrame.style.height = "0"
  printFrame.style.border = "none"
  document.body.appendChild(printFrame)

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document
  if (!frameDoc) {
    document.body.removeChild(printFrame)
    throw new Error("No se pudo crear el iframe de impresión")
  }

  frameDoc.open()
  frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <style>
    @page { margin: 0; }
    body { margin: 0; padding: 0; }
    img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <img src="${dataUrl}" />
</body>
</html>`)
  frameDoc.close()

  return new Promise<void>((resolve) => {
    printFrame.onload = () => {
      // Small delay to ensure image is rendered in the iframe
      setTimeout(() => {
        printFrame.contentWindow?.print()
        // Clean up after print dialog closes
        const cleanup = () => {
          document.body.removeChild(printFrame)
          resolve()
        }
        // Listen for afterprint if supported, otherwise wait
        printFrame.contentWindow?.addEventListener("afterprint", cleanup, { once: true })
        // Fallback timeout in case afterprint doesn't fire
        setTimeout(cleanup, 10000)
      }, 200)
    }
  })
}
