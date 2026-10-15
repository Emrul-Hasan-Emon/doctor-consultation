import { diffLinks } from './link-diff';

describe('diffLinks', () => {
  const existing = [
    { doctorId: 1, isActive: true },
    { doctorId: 2, isActive: true },
    { doctorId: 3, isActive: false },
  ];

  it('creates, reactivates and deactivates', () => {
    expect(diffLinks(existing, [2, 3, 4])).toEqual({
      toCreate: [4],
      toReactivate: [3],
      toDeactivate: [1],
    });
  });

  it('is a no-op when the set is unchanged', () => {
    expect(diffLinks(existing, [1, 2])).toEqual({
      toCreate: [],
      toReactivate: [],
      toDeactivate: [],
    });
  });

  it('does not touch already inactive links that are not wanted', () => {
    expect(diffLinks(existing, [1, 2]).toDeactivate).not.toContain(3);
  });

  it('creates everything when there are no links', () => {
    expect(diffLinks([], [5, 6])).toEqual({
      toCreate: [5, 6],
      toReactivate: [],
      toDeactivate: [],
    });
  });

  it('ignores duplicate ids in the wanted list', () => {
    expect(diffLinks([], [5, 5]).toCreate).toEqual([5]);
  });
});
