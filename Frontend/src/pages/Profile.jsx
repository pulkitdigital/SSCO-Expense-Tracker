import { useEffect, useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function profileToForm(profile) {
  return {
    companyName: profile.companyName || '',
    address: profile.address || '',
    gstin: profile.gstin || '',
    phone: profile.phone || '',
    email: profile.email || '',
  };
}

function Profile() {
  const { profile, updateProfile } = useApp();
  const [form, setForm] = useState(() => profileToForm(profile));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(profileToForm(profile));
  }, [profile]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(form);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      // logged in AppContext
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white p-6 shadow-md"
      >
        <div className="mb-6 flex items-center gap-2">
          <Building2 className="text-indigo-600" size={22} aria-hidden />
          <h2 className="text-lg font-semibold text-gray-800">
            Company Information
          </h2>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Building2 size={16} className="text-gray-400" aria-hidden />
              Company Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={form.companyName}
              onChange={handleChange('companyName')}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <MapPin size={16} className="text-gray-400" aria-hidden />
              Address
            </span>
            <textarea
              value={form.address}
              onChange={handleChange('address')}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <CreditCard size={16} className="text-gray-400" aria-hidden />
              GSTIN
            </span>
            <input
              type="text"
              value={form.gstin}
              onChange={handleChange('gstin')}
              placeholder="22AAAAA0000A1Z5"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
            <p className="mt-1 text-xs text-gray-400">Format: 22AAAAA0000A1Z5</p>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Phone size={16} className="text-gray-400" aria-hidden />
              Phone
            </span>
            <input
              type="text"
              value={form.phone}
              onChange={handleChange('phone')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Mail size={16} className="text-gray-400" aria-hidden />
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Save size={18} aria-hidden />
            Save Profile
          </button>

          {saved && (
            <p className="rounded-lg bg-green-100 px-3 py-2 text-center text-sm font-medium text-green-700">
              Profile saved successfully!
            </p>
          )}
        </div>
      </form>

      <aside className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          PDF Letterhead Preview
        </h2>

        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-[#6366f1] px-6 py-5">
            <h3 className="text-xl font-bold text-white">
              {form.companyName || 'Company Name'}
            </h3>
          </div>
          <div className="space-y-2 bg-white px-6 py-5 text-sm text-gray-500">
            {form.address ? (
              <p className="whitespace-pre-line">{form.address}</p>
            ) : (
              <p className="italic text-gray-400">Address not set</p>
            )}
            {form.gstin && <p>GSTIN: {form.gstin}</p>}
            {form.phone && <p>Phone: {form.phone}</p>}
            {form.email && <p>Email: {form.email}</p>}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          This is how your PDF reports will look
        </p>
      </aside>
    </div>
  );
}

export default Profile;
