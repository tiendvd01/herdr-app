// Machine totals for the Sessions dialog header (spec 028): `CPU 120% / 800% · RAM 2.1 / 16 GB`.
// No herdr import: exec is passed in, so tests drive it with a fake.

export const mem = (b) => (b >= 1073741824 ? `${(b / 1073741824).toFixed(1)} GB` : `${Math.round(b / 1048576)} MB`);
const gb = (b) => `${Math.round(b / 1073741824)} GB`;

/** Logical cores and physical memory (bytes), or null when they can't be read. */
export async function readTotals(exec) {
  try {
    const r = await exec("/usr/sbin/sysctl", ["-n", "hw.ncpu", "hw.memsize"], { timeout: 5000 });
    const [cores, bytes] = String(r?.stdout ?? "").trim().split(/\s+/).map(Number);
    return Number.isInteger(cores) && cores > 0 && Number.isInteger(bytes) && bytes > 0 ? { cores, mem: bytes } : null;
  } catch {
    return null;
  }
}

/** At or above 80% of the total; false when the total is unknown. */
export const hot = (used, total) => total > 0 && used / total >= 0.8;

/** Bar fill in percent, 0..100 (used can pass the total on a decaying ps average). */
export const pct = (used, total) => (total > 0 ? Math.max(0, Math.min(100, (used / total) * 100)) : 0);

const gbNum = (b) => (b / 1073741824).toFixed(1);

/** `CPU 1%`, `CPU 1% / 800%`, or with the whole machine `CPU 1% sessions · 45% machine / 800%`. */
export const cpuText = (cpu, totals, all = null) => {
  if (!totals) return `CPU ${cpu.toFixed(0)}%`;
  const cap = ` / ${totals.cores * 100}%`;
  return all == null ? `CPU ${cpu.toFixed(0)}%${cap}` : `CPU ${cpu.toFixed(0)}% sessions · ${all.toFixed(0)}% machine${cap}`;
};

/** `RAM 2.1 GB`, `RAM 2.1 / 16 GB`, or with the whole machine `RAM 228 MB sessions · 11.2 GB machine / 16 GB`. */
export const ramText = (rss, totals, all = null) => {
  if (!totals) return `RAM ${mem(rss)}`;
  if (all != null) return `RAM ${mem(rss)} sessions · ${gbNum(all)} GB machine / ${gb(totals.mem)}`;
  // Same unit on both sides when used is in GB: `2.1 / 16 GB`; else `512 MB / 16 GB`.
  const used = rss >= 1073741824 ? gbNum(rss) : mem(rss);
  return `RAM ${used} / ${gb(totals.mem)}`;
};
