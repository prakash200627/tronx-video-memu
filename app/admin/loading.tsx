export default function AdminLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center text-sm text-white/50">
      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      Loading admin data...
    </div>
  );
}
