import React, { useState } from 'react'
import Modal from './Modal'

export default function DestructiveConfirmModal({ title, description, confirmationText, onClose, onConfirm, busy }) {
  const [value, setValue] = useState('')
  const confirmed = value === confirmationText

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button
          onClick={onConfirm}
          disabled={!confirmed || busy}
          className="w-full bg-hawkRed text-white font-bold py-3 rounded disabled:opacity-40"
        >
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
      }
    >
      <p className="text-sm text-ink/70 mb-4">{description}</p>
      <label className="block text-sm font-semibold mb-1.5" htmlFor="destructive-confirmation">
        Type <span className="font-mono">{confirmationText}</span> to confirm
      </label>
      <input
        id="destructive-confirmation"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-3 py-2.5 rounded border border-ink/15 focus:outline-none focus:border-hawkRed"
        autoFocus
      />
    </Modal>
  )
}