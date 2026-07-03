// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import AddRoundSheet from './AddRoundSheet'
import type { GameSelection, RamschData, Round } from '../lib/types'

afterEach(cleanup)

const players = [
  { uid: 'a', info: { name: 'Anna', photoURL: null } },
  { uid: 'b', info: { name: 'Bert', photoURL: null } },
  { uid: 'c', info: { name: 'Cara', photoURL: null } },
]

const noop = async () => {}

function baseProps() {
  return {
    players,
    onClose: () => {},
    onSubmitGame: noop,
    onSubmitRamsch: noop,
    onSubmitAdjustment: noop,
  }
}

describe('AddRoundSheet', () => {
  it('renders the game entry form with players, calculator and result toggles', () => {
    render(<AddRoundSheet {...baseProps()} />)
    expect(screen.getByText('Runde eintragen')).toBeTruthy()
    expect(screen.getByText('Anna')).toBeTruthy()
    expect(screen.getByText('Gewonnen')).toBeTruthy()
    expect(screen.getByText('Verloren')).toBeTruthy()
    // Calculator default: Grand mit 1 => 48
    expect(screen.getByText('Spielwert')).toBeTruthy()
    expect(screen.getByText('48')).toBeTruthy()
  })

  it('submits a game round with the calculated value and meta', async () => {
    const calls: Array<[string, number, string, GameSelection | undefined]> = []
    render(
      <AddRoundSheet
        {...baseProps()}
        onSubmitGame={async (uid, value, result, meta) => {
          calls.push([uid, value, result, meta])
        }}
      />,
    )
    fireEvent.click(screen.getByText('Anna'))
    fireEvent.click(screen.getByText('Hand')) // Grand Hand => 72
    fireEvent.click(screen.getByText('Verloren'))
    fireEvent.click(screen.getByText('Eintragen'))

    await Promise.resolve()
    expect(calls.length).toBe(1)
    const [uid, value, result, meta] = calls[0]
    expect(uid).toBe('a')
    expect(value).toBe(72)
    expect(result).toBe('lost')
    expect(meta?.kind).toBe('grand')
    expect(meta?.hand).toBe(true)
  })

  it('blocks a Ramsch submit until Augen sum to 120', async () => {
    const calls: RamschData[] = []
    render(
      <AddRoundSheet
        {...baseProps()}
        onSubmitRamsch={async (r) => {
          calls.push(r)
        }}
      />,
    )
    fireEvent.click(screen.getByText('Ramsch'))
    // Sum is 0 -> submit blocked with an error
    fireEvent.click(screen.getByText('Eintragen'))
    await Promise.resolve()
    expect(calls.length).toBe(0)
    expect(screen.getByText(/oder einen Durchmarsch wählen/)).toBeTruthy()

    // Fill to 120 -> submit passes the data through
    const inputs = screen.getAllByPlaceholderText('0')
    fireEvent.change(inputs[0], { target: { value: '50' } })
    fireEvent.change(inputs[1], { target: { value: '40' } })
    fireEvent.change(inputs[2], { target: { value: '30' } })
    fireEvent.click(screen.getByText('Eintragen'))
    await Promise.resolve()
    expect(calls.length).toBe(1)
    expect(calls[0].augen).toEqual({ a: 50, b: 40, c: 30 })
  })

  it('rehydrates the calculator from a stored gameMeta', () => {
    const editing: Round = {
      id: 'r1',
      seq: 1,
      type: 'game',
      declarerUid: 'a',
      gameValue: 72,
      result: 'won',
      points: { a: 72, b: 0, c: 0 },
      gameMeta: { kind: 'grand', matadors: 1, withMatadors: true, hand: true },
      createdBy: 'a',
      createdAt: null,
    }
    render(<AddRoundSheet {...baseProps()} editing={editing} onDelete={noop} />)
    expect(screen.getByText('Runde bearbeiten')).toBeTruthy()
    expect(screen.getByText('72')).toBeTruthy() // calculated readout
  })

  it('rehydrates a legacy game round into manual mode', () => {
    const editing: Round = {
      id: 'r2',
      seq: 2,
      type: 'game',
      declarerUid: 'b',
      gameValue: 30,
      result: 'won',
      points: { a: 0, b: 30, c: 0 },
      createdBy: 'b',
      createdAt: null,
    }
    render(<AddRoundSheet {...baseProps()} editing={editing} onDelete={noop} />)
    expect(screen.getByDisplayValue('30')).toBeTruthy()
  })
})
