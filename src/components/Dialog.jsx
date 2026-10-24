import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import './Dialog.css'

/**
 * Modal dialog built on the native <dialog> element, which provides focus
 * trapping, Escape handling and an accessible modal role for free.
 * Content is only mounted while open, so forms reset each time.
 */
function Dialog({ open, onClose, title, description, children, footer, as = 'div', onSubmit }) {
  const ref = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal() moves focus to the first focusable element; prefer the one marked for it.
      dialog.querySelector('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const Body = as

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Clicking the backdrop (outside the panel) closes the dialog.
        if (event.target === ref.current) onClose()
      }}
    >
      {open && (
        <Body className="dialog__panel" onSubmit={onSubmit} noValidate={as === 'form' || undefined}>
          <div className="dialog__header">
            <div>
              <h2 id={titleId} className="dialog__title">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="dialog__description">
                  {description}
                </p>
              )}
            </div>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="dialog__body">{children}</div>
          {footer && <div className="dialog__footer">{footer}</div>}
        </Body>
      )}
    </dialog>
  )
}

export default Dialog
