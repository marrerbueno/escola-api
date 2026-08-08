import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  School, 
  FileText, 
  CheckSquare, 
  Bell,
  MessageCircle,
  LogOut 
} from 'lucide-react';

function Layout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/alunos', label: 'Alunos', icon: Users },
    { path: '/professores', label: 'Professores', icon: GraduationCap },
    { path: '/turmas', label: 'Turmas', icon: School },
    { path: '/notas', label: 'Notas', icon: FileText },
    { path: '/presencas', label: 'Presenças', icon: CheckSquare },
    { path: '/notificacoes', label: 'Notificações', icon: Bell },
    { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>📚 Escola</h1>
          <p>Sistema de Gestão</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item.path) ? 'active' : ''}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {usuario?.nome?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="user-name">{usuario?.nome}</div>
              <div className="user-role">{usuario?.role}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
