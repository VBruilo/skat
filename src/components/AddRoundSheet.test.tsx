// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import AddRoundSheet from './AddRoundSheet'

afterEach(cleanup)

const players = [
  { uid: 'a', info: { name: 'Anna', photoURL: null } },
  { uid: 'b', info: { name: 'Bert', photoURL: null } },
  { uid: 'c', info: { name: 'Cara', photoURL: null } },
]

const noop = async () => {}

describe('AddRoundSheet', () => {
  it('renders the game entry form with players and result toggles', () => {
    render(
      <AddRoundSheet players={players} onClose={() => {}} onSubmitGame={noop} onSubmitAdjustment={noop} />,
    )
    expect(screen.getByText('Runde eintragen')).toBeTruthy()
    expect(screen.getByText('Anna')).toBeTruthy()
    expect(screen.getByText('Bert')).toBeTruthy()
    expect(screen.getByText('Gewonnen')).toBeTruthy()
    expect(screen.getByText('Verloren')).toBeTruthy()
  })

  it('submits a game round with declarer, value and result', async () => {
    const calls: Array<[string, number, string]> = []
    render(
      <AddRoundSheet
        players={players}
        onClose={() => {}}
        onSubmitGame={async (uid, value, result) => {
          calls.push([uid, value, result])
        }}
        onSubmitAdjustment={noop}
      />,
    )
    fireEvent.click(screen.getByText('Anna'))
    fireEvent.change(screen.getByPlaceholderText('z. B. 18'), { target: { value: '24' } })
    fireEvent.click(screen.getByText('Verloren'))
    fireEvent.click(screen.getByText('Eintragen'))

    // flush the async submit handler
    await Promise.resolve()
    expect(calls).toEqual([['a', 24, 'lost']])
  })
})
