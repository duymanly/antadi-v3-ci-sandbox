import test from 'node:test';
import assert from 'node:assert/strict';

function permissionFixture(role){
  const data={ADMIN:['all'],EMPLOYEE:['own_tasks','own_bookings'],GUEST:['search']};
  return {
    can(action){return (data[role]||[]).includes(action)||data[role]?.includes('all')===true;}
  };
}

test('admin synthetic role keeps full fixture authority',()=>{
  const f=permissionFixture('ADMIN');
  assert.equal(f.can('anything'),true);
});

test('employee synthetic role cannot cross tenant boundary',()=>{
  const f=permissionFixture('EMPLOYEE');
  assert.equal(f.can('own_tasks'),true);
  assert.equal(f.can('all_employees_data'),false);
});

test('guest synthetic role only receives public search capability',()=>{
  const f=permissionFixture('GUEST');
  assert.equal(f.can('search'),true);
  assert.equal(f.can('booking_management'),false);
});
