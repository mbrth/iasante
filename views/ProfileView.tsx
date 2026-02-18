
import React, { useState } from 'react';
import { UserProfile, Pathology } from '../types';

export const ProfileView: React.FC<{ profile: UserProfile; onUpdateProfile?: (profile: UserProfile) => void }> = ({ profile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile>(profile);

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile(editProfile);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const currentProfile = isEditing ? editProfile : profile;
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-[3rem] p-10 border border-emerald-100 shadow-xl shadow-emerald-900/5 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${profile.sex}&background=059669&color=fff&size=128&bold=true`} 
            className="w-32 h-32 rounded-[2.5rem] border-8 border-emerald-50 shadow-2xl"
            alt="User Avatar"
          />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Votre Dossier Médical</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">ID Patient: NP-{Math.floor(Math.random() * 90000 + 10000)}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">IMC: {profile.bmi.toFixed(1)}</span>
            <span className="px-5 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-200">Métabolisme: Actif</span>
            <span className="px-5 py-2 bg-teal-100 text-teal-700 rounded-full text-xs font-black uppercase tracking-widest border border-teal-200">IA Calibrée</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Physical Metrics */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Métriques Physiques</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                  Modifier
                </button>
              )}
            </div>
            <div className="space-y-6">
              {[
                { label: 'Âge', key: 'age', value: currentProfile.age, unit: 'ans', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Date de Naissance', key: 'birthDate', value: currentProfile.birthDate ? new Date(currentProfile.birthDate).toLocaleDateString('fr-FR') : '-', unit: '', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { label: 'Taille', key: 'height', value: currentProfile.height, unit: 'cm', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' },
                { label: 'Poids', key: 'weight', value: currentProfile.weight, unit: 'kg', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} /></svg>
                    </div>
                    <span className="text-sm font-bold text-slate-500">{m.label}</span>
                  </div>
                  <div className="text-right">
                    {isEditing && m.key !== 'birthDate' ? (
                      <input 
                        type={m.key === 'age' || m.key === 'height' || m.key === 'weight' ? 'number' : 'text'}
                        value={m.key === 'age' ? editProfile.age : m.key === 'height' ? editProfile.height : m.key === 'weight' ? editProfile.weight : ''}
                        onChange={(e) => setEditProfile({...editProfile, [m.key]: m.key === 'age' || m.key === 'height' || m.key === 'weight' ? Number(e.target.value) : e.target.value})}
                        className="w-24 px-3 py-2 rounded-lg bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none font-black text-slate-800"
                      />
                    ) : isEditing && m.key === 'birthDate' ? (
                      <input 
                        type="date"
                        value={editProfile.birthDate}
                        onChange={(e) => setEditProfile({...editProfile, birthDate: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none font-bold text-slate-800"
                      />
                    ) : (
                      <>
                        <span className="text-lg font-black text-slate-800">{m.value}</span>
                        {m.unit && <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{m.unit}</span>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-3 mt-8">
                <button onClick={handleCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition">
                  Annuler
                </button>
                <button onClick={handleSave} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          <div className="bg-teal-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
             <div className="relative z-10">
                <h3 className="text-lg font-black tracking-tight mb-2">Sécurité des données</h3>
                <p className="text-teal-300/60 text-xs leading-relaxed">Vos données médicales sont cryptées de bout en bout et conformes aux normes HDS / RGPD.</p>
                <button className="mt-6 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border border-white/10">Exporter mon Dataset</button>
             </div>
             <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
          </div>
        </div>

        {/* Middle/Right: Clinical & Preferences */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Medical Conditions */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil Clinique</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                  Modifier
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Pathologies Diagnostiquées
                </p>
                {isEditing ? (
                  <input 
                    type="text"
                    placeholder="Séparées par des virgules (ex: Diabète, Hypertension)"
                    value={editProfile.pathologies.join(', ')}
                    onChange={(e) => setEditProfile({...editProfile, pathologies: e.target.value.split(',').map(p => p.trim()) as any})}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none rounded-xl font-bold text-slate-800"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.pathologies.map(p => (
                      <span key={p} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">{p}</span>
                    ))}
                    {currentProfile.pathologies.length === 0 && <span className="text-slate-400 text-xs italic">Aucune pathologie déclarée</span>}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Traitements en cours
                </p>
                {isEditing ? (
                  <input 
                    type="text"
                    placeholder="Séparés par des virgules (ex: Metformine, Lisinopril)"
                    value={editProfile.treatments.join(', ')}
                    onChange={(e) => setEditProfile({...editProfile, treatments: e.target.value.split(',').map(t => t.trim())})}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none rounded-xl font-bold text-slate-800"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.treatments.map(t => (
                      <span key={t} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">{t}</span>
                    ))}
                    {currentProfile.treatments.length === 0 && <span className="text-slate-400 text-xs italic">Aucun traitement renseigné</span>}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 pt-4 border-t border-slate-50">
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Allergies & Intolérances
                </p>
                {isEditing ? (
                  <input 
                    type="text"
                    placeholder="Séparées par des virgules (ex: Pénicilline, Gluten)"
                    value={editProfile.allergies.join(', ')}
                    onChange={(e) => setEditProfile({...editProfile, allergies: e.target.value.split(',').map(a => a.trim())})}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none rounded-xl font-bold text-slate-800"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.allergies.map(a => (
                      <span key={a} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">{a}</span>
                    ))}
                    {currentProfile.allergies.length === 0 && <span className="text-slate-400 text-xs italic">Aucune allergie connue</span>}
                  </div>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="flex gap-3 mt-8 border-t border-slate-50 pt-8">
                <button onClick={handleCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition">
                  Annuler
                </button>
                <button onClick={handleSave} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          {/* Preferences & Goals */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuration IA</h3>
               {!isEditing && (
                 <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                   Modifier
                 </button>
               )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Objectifs de Santé</p>
                   {isEditing ? (
                     <input 
                       type="text"
                       placeholder="Séparés par des virgules (ex: Stabiliser glucose, Perdre du poids)"
                       value={editProfile.goals.join(', ')}
                       onChange={(e) => setEditProfile({...editProfile, goals: e.target.value.split(',').map(g => g.trim())})}
                       className="w-full px-4 py-3 bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none rounded-xl font-bold text-slate-800"
                     />
                   ) : (
                     <ul className="space-y-3">
                        {currentProfile.goals.map((g, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                            {g}
                          </li>
                        ))}
                     </ul>
                   )}
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Préférences Alimentaires</p>
                   {isEditing ? (
                     <input 
                       type="text"
                       placeholder="Séparées par des virgules (ex: Végétarien, Low-Carb, Gluten-Free)"
                       value={editProfile.preferences.join(', ')}
                       onChange={(e) => setEditProfile({...editProfile, preferences: e.target.value.split(',').map(p => p.trim())})}
                       className="w-full px-4 py-3 bg-white border-2 border-emerald-300 focus:border-emerald-600 outline-none rounded-xl font-bold text-slate-800"
                     />
                   ) : (
                     <div className="flex flex-wrap gap-2">
                        {currentProfile.preferences.map(pref => (
                          <span key={pref} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">{pref}</span>
                        ))}
                        {currentProfile.preferences.length === 0 && <span className="text-slate-400 text-xs italic">Aucune préférence spécifiée</span>}
                     </div>
                   )}
                </div>
             </div>

             {isEditing && (
               <div className="flex gap-3 mt-8 border-t border-slate-50 pt-8">
                 <button onClick={handleCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition">
                   Annuler
                 </button>
                 <button onClick={handleSave} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
                   Sauvegarder
                 </button>
               </div>
             )}

             <div className="mt-10 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex items-center justify-between group cursor-help">
                <div className="flex gap-4">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Moteur Adaptatif</p>
                      <p className="text-xs text-indigo-700 leading-relaxed font-bold">Votre plan nutritionnel est recalculé dynamiquement chaque matin à 04:00 selon ces critères.</p>
                   </div>
                </div>
                <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition duration-300">
                   <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
