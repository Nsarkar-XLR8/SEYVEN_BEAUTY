import { GeoZoneService } from './geo-zone.service';

describe('GeoZoneService', () => {
  let service: GeoZoneService;

  beforeEach(() => {
    service = new GeoZoneService();
  });

  it('should return all 8 divisions of Bangladesh', () => {
    const divisions = service.getAllDivisions();
    expect(divisions).toHaveLength(8);
    expect(divisions.some((d) => d.nameEn === 'Dhaka')).toBe(true);
    expect(divisions.some((d) => d.nameEn === 'Chittagong')).toBe(true);
  });

  it('should return thanas for a given district', () => {
    const thanas = service.getThanasForDistrict('Dhaka');
    expect(thanas.length).toBeGreaterThan(0);
    expect(thanas.some((t) => t.nameEn === 'Dhanmondi')).toBe(true);
  });

  it('should resolve Inside Dhaka (Zone 1) with ৳80 base fee', () => {
    const zone = service.resolveCourierZone('Dhaka', 'Dhaka', 'Gulshan');
    expect(zone.courierZoneId).toBe(1);
    expect(zone.baseFee).toBe(80);
    expect(zone.zoneName).toContain('Dhaka');
  });

  it('should resolve Dhaka Suburbs (Zone 2) with ৳100 base fee', () => {
    const zone = service.resolveCourierZone('Dhaka', 'Gazipur', 'Tongi');
    expect(zone.courierZoneId).toBe(2);
    expect(zone.baseFee).toBe(100);
  });

  it('should resolve Outside Dhaka (Zone 3) with ৳120 base fee', () => {
    const zone = service.resolveCourierZone('Sylhet', 'Sylhet', 'Zindabazar');
    expect(zone.courierZoneId).toBe(3);
    expect(zone.baseFee).toBe(120);
  });
});
