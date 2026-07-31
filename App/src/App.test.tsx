import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('introduces the StudyPack foundation', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /ôn trắc nghiệm/i })).toBeInTheDocument()
  })
})
