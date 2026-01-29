
import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { CheckinRecord, CheckinConfig } from '../types';

type ViewMode = 'day' | 'month' | 'year';
type SortMode = 'name_asc' | 'date_desc' | 'date_asc';

const ProfessorPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState<CheckinConfig | null>(null);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [sortMode, setSortMode] = useState<SortMode>('date_desc');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [conf, recs] = await Promise.all([
        storage.getConfig(),
        storage.getRecords()
      ]);
      setConfig(conf);
      setRecords(recs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'professor' && password === '2020') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas.');
    }
  };

  const toggleCheckin = async (enabled: boolean) => {
    try {
      await storage.saveConfig({ checkin_enabled: enabled, updated_by: 'professor' });
      const newConfig = await storage.getConfig();
      setConfig(newConfig);
    } catch (err) {
      alert('Erro ao atualizar configuração.');
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (window.confirm(`Apagar registro de ${name}?`)) {
      try {
        await storage.deleteRecord(id);
        setRecords(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        alert('Erro ao deletar.');
      }
    }
  };

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records.filter(r => {
      if (viewMode === 'day') return r.data === selectedDate;
      if (viewMode === 'month') return r.data.startsWith(selectedMonth);
      if (viewMode === 'year') return r.data.startsWith(selectedYear);
      return true;
    });

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      filtered = filtered.filter(r => r.nome_completo.toLowerCase().includes(low) || r.matricula.includes(searchTerm));
    }

    return [...filtered].sort((a, b) => {
      if (sortMode === 'name_asc') return a.nome_completo.localeCompare(b.nome_completo);
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortMode === 'date_desc' ? timeB - timeA : timeA - timeB;
    });
  }, [records, viewMode, selectedDate, selectedMonth, selectedYear, sortMode, searchTerm]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Acesso do Professor</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Usuário" className="w-full px-4 py-2 border rounded-lg" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full px-4 py-2 border rounded-lg" required />
          {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
          <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 rounded-lg">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Painel de Controle</h2>
        <button onClick={loadData} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors">
          🔄 Sincronizar Agora
        </button>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${config?.checkin_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {config?.checkin_enabled ? 'SISTEMA ABERTO' : 'SISTEMA FECHADO'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleCheckin(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50" disabled={config?.checkin_enabled}>Abrir Check-in</button>
            <button onClick={() => toggleCheckin(false)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50" disabled={!config?.checkin_enabled}>Fechar Check-in</button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex flex-wrap gap-4">
          <input type="text" placeholder="Filtrar aluno..." className="px-3 py-2 border rounded-md text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <select value={viewMode} onChange={e => setViewMode(e.target.value as ViewMode)} className="px-3 py-2 border rounded-md text-sm">
            <option value="day">Hoje</option>
            <option value="month">Mês</option>
          </select>
          {viewMode === 'day' && <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-md text-sm" />}
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-10 text-center text-slate-400">Carregando dados...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRecords.map(r => (
                  <tr key={r.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{r.data} {r.hora}</td>
                    <td className="px-4 py-3 font-bold">{r.nome_completo}</td>
                    <td className="px-4 py-3 font-mono">{r.matricula}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteRecord(r.id, r.nome_completo)} className="text-red-500 hover:text-red-700">Excluir</button>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedRecords.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center italic text-slate-400">Nenhuma presença registrada.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfessorPanel;
