import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, parseDate, weekDates, countDone, validRecords } from './habits.mjs';

test('dates retain local calendar days', () => {
  assert.equal(dateKey(parseDate('2026-10-27')), '2026-10-27');
});
test('weeks cross year boundaries and start on Monday, including Sunday selection', () => {
  assert.deepEqual(weekDates('2027-01-03'), ['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
});
test('completion counts belong to each date and require a true value', () => {
  const records = { '2026-10-27': { gym: true, study: false, reading: 'true' }, '2026-10-26': { study: true, reading: true } };
  assert.equal(countDone(records, '2026-10-27'), 1);
  assert.equal(countDone(records, '2026-10-26'), 2);
  assert.equal(countDone(records, '2026-10-25'), 0);
});
test('stored data tolerates missing and malformed records', () => {
  for (const value of [null, [], 'oops', 8]) assert.deepEqual(validRecords(value), {});
  assert.deepEqual(validRecords({ invalid: {}, '2026-10-27': null, '2026-10-28': {gym: true, study: 'yes'} }), { '2026-10-28': { gym: true, study: false, reading: false } });
});

test('streak crosses months, tolerates unfinished today, and stops at a missing day', async () => {
  const { streak } = await import('./habits.mjs');
  const records = { '2026-10-31': {gym:true}, '2026-11-01': {gym:true} };
  assert.equal(streak(records, 'gym', '2026-11-02', '2026-11-02'), 2);
  assert.equal(streak(records, 'gym', '2026-11-01', '2026-11-02'), 2);
  assert.equal(streak(records, 'gym', '2026-11-03', '2026-11-03'), 0);
  assert.equal(streak(records, 'study', '2026-11-02', '2026-11-02'), 0);
  records['2026-11-02'] = {gym:true};
  assert.equal(streak(records, 'gym', '2026-11-02', '2026-11-02'), 3);
  records['2026-11-01'].gym = false;
  assert.equal(streak(records, 'gym', '2026-11-02', '2026-11-02'), 1);
});
test('memo survives serialization without dropping existing study records', () => {
  const original = {'2026-10-27': {study:true,memo:'単語20個\n<script>メモ</script>'}};
  const restored = validRecords(JSON.parse(JSON.stringify(original)));
  assert.equal(restored['2026-10-27'].memo, original['2026-10-27'].memo);
  assert.equal(restored['2026-10-27'].study, true);
  assert.equal(validRecords({'2026-10-27': {memo:'あ'.repeat(2001)}})['2026-10-27'].memo.length, 2000);
});
test('weekly rate excludes future days and includes all seven days for past weeks', async () => {
  const { weekProgress } = await import('./habits.mjs');
  const records = {'2026-10-26': {gym:true,study:true,reading:true}};
  assert.deepEqual(weekProgress(records, '2026-10-27', '2026-10-27'), {done:3,total:6,percentage:50});
  assert.deepEqual(weekProgress(records, '2026-10-27', '2026-11-03'), {done:3,total:21,percentage:14});
});
