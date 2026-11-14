import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MultiCharacterManager from './MultiCharacterManager'

describe('MultiCharacterManager — character kind', () => {
  it('hides the kind selector by default and adds children', () => {
    const onAdd = vi.fn()
    render(
      <MultiCharacterManager
        characters={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.queryByRole('group', { name: 'Character type' })).toBeNull()

    fireEvent.click(screen.getByText('+ Add by name only'))
    fireEvent.change(screen.getByPlaceholderText('Character name'), { target: { value: 'Luna' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith('Luna', undefined, 'child', undefined)
    expect(screen.queryByLabelText('Pet species')).toBeNull()
  })

  it('shows the kind selector for child + pet books and adds a pet with species', () => {
    const onAdd = vi.fn()
    render(
      <MultiCharacterManager
        characters={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        showKindSelector
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /pet/i }))
    fireEvent.click(screen.getByText('+ Add by name only'))
    fireEvent.change(screen.getByPlaceholderText('Character name'), { target: { value: 'Buddy' } })
    fireEvent.change(screen.getByLabelText('Pet species'), { target: { value: 'dog' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith('Buddy', undefined, 'pet', 'dog')
  })

  it('adds pets by default when defaultKind is pet', () => {
    const onAdd = vi.fn()
    render(
      <MultiCharacterManager
        characters={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
        defaultKind="pet"
      />,
    )

    expect(screen.queryByRole('group', { name: 'Character type' })).toBeNull()
    fireEvent.click(screen.getByText('+ Add by name only'))
    fireEvent.change(screen.getByPlaceholderText('Character name'), { target: { value: 'Mochi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith('Mochi', undefined, 'pet', undefined)
  })

  it('marks pet characters with a paw badge', () => {
    render(
      <MultiCharacterManager
        characters={[
          { id: 'c1', name: 'Luna', kind: 'child' },
          { id: 'c2', name: 'Buddy', kind: 'pet' },
        ]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByText('Buddy')).toBeTruthy()
    expect(screen.getByText('Pet')).toBeTruthy()
  })
})
