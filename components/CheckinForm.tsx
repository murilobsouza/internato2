
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { CheckinRecord } from '../types';

const CheckinForm: React.FC = () => {
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await storage.getConfig();
        setIsEnabled(config.checkin_enabled);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const validateName = (name: string) => {
    return name.trim().split(/\s+/).length >= 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isEnabled) {
      setMessage({ text: 'Registro de presença indisponível no momento. Procure o professor.', type: 'error' });
      return;
    }

    if (!validateName(nome)) {
      setMessage({ text: 'Por favor, insira o nome completo (pelo menos duas palavras).', type: 'error' });
      return;
    }

    if (!matricula.trim()) {
      setMessage({ text: 'O número de matrícula é obrigatório.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const existing = await storage.hasRecordToday(matricula);
      if (existing) {
        setMessage({ 
          text: `Já existe um registro para esta matrícula hoje às ${existing.hora}.`, 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const timestamp = now.toISOString();
      const dateStr = timestamp.split('T')[0];
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const newRecord: CheckinRecord = {
        id: crypto.randomUUID(),
        nome_completo: nome.trim(),
        matricula: matricula.trim(),
        timestamp,
        data: dateStr,
        hora: timeStr,
        ip: 'Verificado pelo Servidor',
        user_agent: navigator.userAgent,
        device_hint: `${navigator.platform}`,
        status: 'registrado'
      };

      await storage.saveRecord(newRecord);

      setMessage({ 
        text: `Presença registrada com sucesso em ${new Date(dateStr).toLocaleDateString('pt-BR')} às ${timeStr}.`, 
        type: 'success' 
      });
      setNome('');
      setMatricula('');
    } catch (err) {
      setMessage({ text: 'Erro ao conectar ao banco de dados. Verifique sua conexão.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-red-100 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Check-in Desativado</h2>
        <p className="text-slate-600">O professor encerrou o período de registros para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 p-8 bg-white rounded-xl shadow-lg border border-indigo-50">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Registro de Presença</h2>
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Ex: João Silva Santos"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Matrícula</label>
          <input
            type="text"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Digite sua matrícula"
            required
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : 'Enviar Presença'}
        </button>
      </form>
    </div>
  );
};

export default CheckinForm;
