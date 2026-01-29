
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
    // Credenciais conforme solicitado anteriormente
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
      filtered = filtered.filter(r => 
        r.nome_completo.toLowerCase().includes(low) || 
        r.matricula.includes(searchTerm)
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortMode === 'name_asc') {
        return a.nome_completo.localeCompare(b.nome_completo);
      }
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
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usuário</label>
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="professor" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="****" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          {loginError && <p className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100">{loginError}</p>}
          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition-colors">Entrar no Painel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel de Controle</h2>
          <p className="text-slate-500 text-sm">Gerencie a frequência e visualize relatórios.</p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 text-sm bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
        >
          <span>🔄</span> Sincronizar Dados
        </button>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status do Sistema</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block text-center ${config?.checkin_enabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {config?.checkin_enabled ? '🟢 RECEBENDO REGISTROS' : '🔴 REGISTROS BLOQUEADOS'}
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => toggleCheckin(true)} 
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-30" 
              disabled={config?.checkin_enabled}
            >
              Abrir Check-in
            </button>
            <button 
              onClick={() => toggleCheckin(false)} 
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-30" 
              disabled={!config?.checkin_enabled}
            >
              Fechar Check-in
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1 uppercase">Buscar Aluno</label>
              <input 
                type="text" 
                placeholder="Nome ou matrícula..." 
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>

            {/* Visualização */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1 uppercase">Período</label>
              <div className="flex gap-2">
                <select 
                  value={viewMode} 
                  onChange={e => setViewMode(e.target.value as ViewMode)} 
                  className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="day">Por Dia</option>
                  <option value="month">Por Mês</option>
                  <option value="year">Por Ano</option>
                </select>
                
                {viewMode === 'day' && (
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                )}
                {viewMode === 'month' && (
                  <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                )}
                {viewMode === 'year' && (
                  <input 
                    type="number" 
                    min="2020" 
                    max="2100" 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(e.target.value)} 
                    className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                )}
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1 uppercase">Ordenar por</label>
              <select 
                value={sortMode} 
                onChange={e => setSortMode(e.target.value as SortMode)} 
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="date_desc">Mais Recentes</option>
                <option value="date_asc">Mais Antigos</option>
                <option value="name_asc">Nome (A-Z)</option>
              </select>
            </div>

            {/* Contador Rápido */}
            <div className="flex flex-col justify-end">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2">
                👥 {filteredAndSortedRecords.length} Alunos Listados
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 text-center">
               <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
               <p className="text-slate-400 font-medium">Carregando registros...</p>
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Data/Hora</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Nome Completo</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Matrícula</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium">{r.data}</div>
                      <div className="text-slate-400 text-xs">{r.hora}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{r.nome_completo}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-600 text-xs">
                      {r.matricula}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteRecord(r.id, r.nome_completo)} 
                        className="text-slate-300 hover:text-red-600 transition-colors p-2"
                        title="Remover registro"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-20 text-center italic text-slate-400">
                      <div className="text-4xl mb-4">🔍</div>
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
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
