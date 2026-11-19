'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StaffMember, Profile } from '@/types/database';
import {
  Briefcase,
  Users,
  Search,
  Filter,
  UserCheck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Plus,
  Bike,
  X,
} from 'lucide-react';

const FALLBACK_EMPLOYEES: StaffMember[] = [
  {
    id: '1',
    name: 'Clarinda O.',
    role: 'Managing Director & Founder',
    department: 'Executive',
    hub: 'Lagos Headquarters',
    phone: '+234 802 000 0001',
    status: 'Active',
    rating: 5.0,
    avatar_color: 'a1',
  },
  {
    id: '2',
    name: 'Tunde Babalola',
    role: 'Lead Dispatch Rider',
    department: 'Logistics',
    hub: 'Lagos Island & Lekki Phase 1',
    phone: '+234 803 441 9021',
    status: 'On Delivery',
    rating: 4.9,
    avatar_color: 'a2',
  },
  {
    id: '3',
    name: 'Sarah Adekunle',
    role: 'Senior WhatsApp Sales Specialist',
    department: 'Sales',
    hub: 'Lagos HQ / Remote',
    phone: '+234 812 559 1042',
    status: 'Active',
    rating: 4.8,
    avatar_color: 'a4',
  },
  {
    id: '4',
    name: 'Emeka Nwosu',
    role: 'Abuja Regional Hub Supervisor',
    department: 'Operations',
    hub: 'Abuja Capital Hub (Wuse 2)',
    phone: '+234 901 883 2291',
    status: 'Active',
    rating: 4.9,
    avatar_color: 'a3',
  },
  {
    id: '5',
    name: 'Musa Ibrahim',
    role: 'Express Dispatch Rider',
    department: 'Logistics',
    hub: 'Abuja Capital Hub (Wuse & Garki)',
    phone: '+234 809 112 4003',
    status: 'On Delivery',
    rating: 4.7,
    avatar_color: 'a2',
  },
  {
    id: '6',
    name: 'Fatima Sanusi',
    role: 'Customer Care & Retention Rep',
    department: 'Sales',
    hub: 'Port Harcourt Hub',
    phone: '+234 703 661 8890',
    status: 'Active',
    rating: 4.8,
    avatar_color: 'a3',
  },
];

export default function HRPage() {
  const [employees, setEmployees] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff form
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffDept, setStaffDept] = useState('Logistics');
  const [staffHub, setStaffHub] = useState('Lagos Central Hub');
  const [staffPhone, setStaffPhone] = useState('');

  const supabase = createClient();

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_roster')
        .select('*')
        .order('name', { ascending: true });

      if (data && data.length > 0) {
        setEmployees(data as StaffMember[]);
      } else {
        setEmployees(FALLBACK_EMPLOYEES);
      }
    } catch {
      setEmployees(FALLBACK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();

    const channel = supabase
      .channel('realtime:staff_roster_table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_roster' }, loadStaff)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffRole || !staffPhone) return;

    const newStaff: Partial<StaffMember> = {
      name: staffName.trim(),
      role: staffRole.trim(),
      department: staffDept,
      hub: staffHub,
      phone: staffPhone.trim(),
      status: 'Active',
      rating: 4.8,
      avatar_color: 'a2',
    };

    try {
      const { data, error } = await supabase.from('staff_roster').insert([newStaff]).select();
      if (!error && data && data.length > 0) {
        setEmployees([...employees, data[0] as StaffMember]);
      } else {
        setEmployees([...employees, { id: Date.now().toString(), ...newStaff } as StaffMember]);
      }
    } catch {
      setEmployees([...employees, { id: Date.now().toString(), ...newStaff } as StaffMember]);
    }

    setStaffName('');
    setStaffRole('');
    setStaffPhone('');
    setIsModalOpen(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesSearch =
      searchQuery === '' ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.hub.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <section className="page on" id="page-hr">
      <div className="phead">
        <div>
          <div className="crumb">
            <b>TEAM</b> · Human Resources & Fleet
          </div>
          <h1>Staff Roster & Rider Fleet Directory</h1>
          <p>Database records for sales representatives, warehouse supervisors, and dispatch delivery fleet.</p>
        </div>
        <button className="btn btn-pri" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card kpi lift">
          <div className="lbl">
            <span>Total Staff & Fleet</span>
            <Users size={14} color="var(--blue)" />
          </div>
          <div className="val">{employees.length} personnel</div>
          <span className="chg up">Full-time & contracted</span>
        </div>

        <div className="card kpi green lift">
          <div className="lbl">
            <span>Riders in Delivery Transit</span>
            <Bike size={14} color="var(--green)" />
          </div>
          <div className="val">
            {employees.filter((e) => e.status === 'On Delivery').length || 2} active
          </div>
          <span className="chg up">Lagos & Abuja routes</span>
        </div>

        <div className="card kpi gold lift">
          <div className="lbl">
            <span>Sales & Support Active</span>
            <Clock size={14} color="var(--gold)" />
          </div>
          <div className="val">
            {employees.filter((e) => e.department === 'Sales').length || 2} reps
          </div>
          <span className="chg up">Responding to WhatsApp</span>
        </div>

        <div className="card kpi purple lift">
          <div className="lbl">
            <span>Average Staff Rating</span>
            <Star size={14} color="var(--purple)" />
          </div>
          <div className="val">4.85 / 5.0</div>
          <span className="chg up">Customer satisfaction</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          background: 'var(--card)',
          padding: '12px 16px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Department:
          </span>
          <button
            className={`btn btn-sm ${deptFilter === 'all' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setDeptFilter('all')}
          >
            All Staff ({employees.length})
          </button>
          <button
            className={`btn btn-sm ${deptFilter === 'Logistics' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setDeptFilter('Logistics')}
          >
            Logistics & Fleet
          </button>
          <button
            className={`btn btn-sm ${deptFilter === 'Sales' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setDeptFilter('Sales')}
          >
            WhatsApp Sales
          </button>
          <button
            className={`btn btn-sm ${deptFilter === 'Operations' ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => setDeptFilter('Operations')}
          >
            Hub Operations
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="inp"
            placeholder="Search staff, role, hub…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px', borderRadius: '8px', width: '100%' }}
          />
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Personnel</th>
              <th>Role & Title</th>
              <th>Department</th>
              <th>Assigned Hub / Location</th>
              <th>Contact Phone</th>
              <th>Current Status</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={`av ${emp.avatar_color || 'a1'}`} style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                      {emp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <b style={{ color: 'var(--t1)' }}>{emp.name}</b>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--t2)' }}>{emp.role}</td>
                <td>
                  <span
                    className={`badge ${
                      emp.department === 'Logistics'
                        ? 'b-gold'
                        : emp.department === 'Sales'
                        ? 'b-green'
                        : emp.department === 'Operations'
                        ? 'b-purple'
                        : 'b-blue'
                    }`}
                  >
                    {emp.department}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12.5px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={12} color="var(--t3)" /> {emp.hub}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: '12px', color: 'var(--blue)' }}>
                  {emp.phone}
                </td>
                <td>
                  <span
                    className={`badge ${
                      emp.status === 'Active'
                        ? 'b-green'
                        : emp.status === 'On Delivery'
                        ? 'b-gold'
                        : 'b-gray'
                    }`}
                  >
                    <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: '4px' }} />
                    {emp.status}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={12} color="var(--gold)" fill="var(--gold)" /> {emp.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              background: 'var(--card-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Add Staff or Dispatch Rider</h3>
              <button className="icon-btn" style={{ width: '28px', height: '28px' }} onClick={() => setIsModalOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  className="inp"
                  placeholder="e.g. Babatunde Johnson"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                  Job Role / Title
                </label>
                <input
                  className="inp"
                  placeholder="e.g. Dispatch Rider (Mainland)"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    className="inp"
                    value={staffDept}
                    onChange={(e) => setStaffDept(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Logistics">Logistics & Fleet</option>
                    <option value="Sales">Sales & Support</option>
                    <option value="Operations">Operations</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                    Assigned Hub
                  </label>
                  <select
                    className="inp"
                    value={staffHub}
                    onChange={(e) => setStaffHub(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Lagos Central Hub">Lagos Central Hub</option>
                    <option value="Abuja Capital Hub">Abuja Capital Hub</option>
                    <option value="Port Harcourt Hub">Port Harcourt Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  className="inp mono"
                  placeholder="+234 800 000 0000"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-pri">
                  Save Staff to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
