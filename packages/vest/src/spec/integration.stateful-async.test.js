import resetState from '../../testUtils/resetState';
import runSpec from '../../testUtils/runSpec';

const suite = ({ create, test, ...vest }) =>
  create('suite_name', skip => {
    vest.skip(skip);
    test('field_1', 'field_statement_1', () => false);

    test('field_2', () =>
      new Promise((resolve, reject) => {
        setTimeout(() => reject('rejection_message_1'), 50);
      }));
    test('field_2', 'field_statement_2', () => {});

    test('field_3', 'field_statement_3', () => Promise.resolve());
  });

runSpec(vest => {
  let validate, callback_1, callback_2, callback_3, callback_4, control;
  describe('Stateful async tests', () => {
    beforeEach(() => {
      resetState();
      callback_1 = jest.fn();
      callback_2 = jest.fn();
      callback_3 = jest.fn();
      callback_4 = jest.fn();
      control = jest.fn();
      validate = suite(vest);
    });

    it('Should only run callbacks for last suite run', () =>
      new Promise(done => {
        validate(vest).done(callback_1).done('field_3', callback_2);
        expect(callback_1).not.toHaveBeenCalled();
        expect(callback_2).not.toHaveBeenCalled();
        validate(vest).done(callback_3).done('field_3', callback_4);
        expect(callback_3).not.toHaveBeenCalled();
        expect(callback_4).not.toHaveBeenCalled();
        setTimeout(() => {
          expect(callback_1).not.toHaveBeenCalled();
          expect(callback_2).not.toHaveBeenCalled();
          expect(callback_3).not.toHaveBeenCalled();
          expect(callback_4).toHaveBeenCalled();
          control();
        });
        setTimeout(() => {
          expect(callback_1).not.toHaveBeenCalled();
          expect(callback_2).not.toHaveBeenCalled();
          expect(callback_3).toHaveBeenCalled();
          expect(control).toHaveBeenCalled();
          done();
        }, 50);
      }));

    it('Merges skipped validations from previous suite', () =>
      new Promise(done => {
        const res = validate();
        expect(res.hasErrors('field_2')).toBe(false);
        validate('field_2').done(res => {
          expect(res.hasErrors('field_2')).toBe(true);
          done();
        });
      }));
  });
});
