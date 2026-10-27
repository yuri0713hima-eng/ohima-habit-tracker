import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, parseDate, weekDates, countDone, validRecords, cumulativeDays } from './habits.mjs';

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

test('cumulative days count each habit independently across breaks and years', () => {
  const records = {
    '2025-12-31': {gym:true, study:true, reading:false, memo:'去年の記録'},
    '2026-01-01': {gym:false, study:false, reading:true},
    '2026-03-10': {gym:true, study:false, reading:true},
    '2026-10-28': {gym:true, study:true, reading:true},
  };
  assert.equal(cumulativeDays(records, 'gym', '2026-10-28'), 3);
  assert.equal(cumulativeDays(records, 'study', '2026-10-28'), 2);
  assert.equal(cumulativeDays(records, 'reading', '2026-10-28'), 3);
  assert.equal(cumulativeDays(records, 'gym', '2026-02-01'), 1);
});
test('historical totals include the selected day and exclude later achievements', () => {
  const records = {'2026-10-26': {gym:true}, '2026-10-27': {gym:true}, '2026-10-28': {gym:true}};
  assert.equal(cumulativeDays(records, 'gym', '2026-10-27'), 2);
  assert.equal(cumulativeDays(records, 'gym', '2026-10-25'), 0);
  assert.equal(cumulativeDays({}, 'gym', '2026-10-28'), 0);
});
test('counting preserves records and notes, and reflects undo without resetting earlier totals', () => {
  const records = {'2026-10-26': {gym:true,study:true,memo:'大切なメモ'}, '2026-10-28': {gym:true,reading:true,memo:'今日の記録'}};
  const original = JSON.stringify(records);
  assert.equal(cumulativeDays(records, 'gym', '2026-10-28'), 2);
  assert.equal(JSON.stringify(records), original);
  records['2026-10-28'].gym = false;
  assert.equal(cumulativeDays(records, 'gym', '2026-10-28'), 1);
  assert.equal(records['2026-10-26'].memo, '大切なメモ');
  assert.equal(records['2026-10-28'].reading, true);
});
test('only true achievements count, not missing, false, or string values', () => {
  const records = {'2026-10-24': {gym:'true'}, '2026-10-25': {gym:false}, '2026-10-26': {memo:'休み'}, '2026-10-27': {gym:true}};
  assert.equal(cumulativeDays(records, 'gym', '2026-10-28'), 1);
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
