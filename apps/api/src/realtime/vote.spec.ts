import type { PublicSlide } from '@chorus/shared';
import { aggregateResults, normalizeVote, resolveVoteAction, sanitizeText } from './vote';

const choice: PublicSlide = {
  id: 's1',
  position: 0,
  type: 'multiple_choice',
  question: 'Favorite color?',
  options: [
    { id: 'a', text: 'Blue' },
    { id: 'b', text: 'Green' },
  ],
  settings: { allowVoteChange: false, showResults: false, votingOpen: true, hideOpenText: false },
};

const scale: PublicSlide = { ...choice, id: 's2', type: 'scale', options: [] };

describe('normalizeVote', () => {
  it('accepts an existing option', () => {
    expect(normalizeVote(choice, { type: 'multiple_choice', optionId: 'a' })).toEqual({
      ok: true,
      payload: { type: 'multiple_choice', optionId: 'a' },
    });
  });

  it('rejects an option that does not belong to the slide', () => {
    expect(normalizeVote(choice, { type: 'multiple_choice', optionId: 'zzz' })).toMatchObject({ ok: false });
  });

  it('rejects a payload of the wrong slide type', () => {
    expect(normalizeVote(choice, { type: 'scale', value: 3 })).toMatchObject({ ok: false });
  });

  it('keeps only the first lowercased word for word clouds', () => {
    const wordCloud: PublicSlide = { ...choice, type: 'word_cloud', options: [] };
    expect(normalizeVote(wordCloud, { type: 'word_cloud', word: '  Harika Bir Şey ' })).toEqual({
      ok: true,
      payload: { type: 'word_cloud', word: 'harika' },
    });
  });
});

describe('resolveVoteAction (duplicate vote guard)', () => {
  it('inserts a first vote', () => {
    expect(resolveVoteAction({ alreadyVoted: false, allowVoteChange: false })).toBe('insert');
  });

  it('rejects a second vote when changes are not allowed', () => {
    expect(resolveVoteAction({ alreadyVoted: true, allowVoteChange: false })).toBe('reject');
  });

  it('updates the vote when changes are allowed', () => {
    expect(resolveVoteAction({ alreadyVoted: true, allowVoteChange: true })).toBe('update');
  });
});

describe('aggregateResults', () => {
  it('counts multiple choice votes including zero-vote options', () => {
    const results = aggregateResults(choice, [
      { id: 'r1', payload: { type: 'multiple_choice', optionId: 'a' } },
      { id: 'r2', payload: { type: 'multiple_choice', optionId: 'a' } },
    ]);
    expect(results).toEqual({ type: 'multiple_choice', total: 2, counts: { a: 2, b: 0 } });
  });

  it('computes scale average and distribution', () => {
    const results = aggregateResults(scale, [
      { id: 'r1', payload: { type: 'scale', value: 5 } },
      { id: 'r2', payload: { type: 'scale', value: 4 } },
      { id: 'r3', payload: { type: 'scale', value: 4 } },
    ]);
    expect(results).toMatchObject({ type: 'scale', total: 3, average: 4.33 });
    expect(results.type === 'scale' && results.distribution).toEqual({ '1': 0, '2': 0, '3': 0, '4': 2, '5': 1 });
  });

  it('returns zero average when there are no votes', () => {
    expect(aggregateResults(scale, [])).toMatchObject({ total: 0, average: 0 });
  });
});

describe('sanitizeText', () => {
  it('strips html tags and control characters', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>Merhaba\u0007  dünya ')).toBe('Merhaba dünya');
  });
});
