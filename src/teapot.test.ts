import imaTeaPot from './teapot';

describe('teapot', () => {
  describe('imaTeaPot', () => {
    test('don\'t stick that there, Jerry', () => {
      expect(imaTeaPot('Jerry')).toBe('Jerry is a little tea pot.');
    });
  });
});
