using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace DairyFarmERP
{
    static class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private const int PORT = 3001;
        private static readonly string HEALTH_URL = "http://localhost:" + PORT + "/api/health";
        private static readonly string APP_URL = "http://localhost:" + PORT;

        private static NotifyIcon trayIcon;
        private static Process serverProcess;
        private static string baseDir;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool isFirstInstance;
            using (Mutex mutex = new Mutex(true, "Global\\DairyFarmERP_TrayInstanceMutex", out isFirstInstance))
            {
                if (!isFirstInstance)
                {
                    // Re-open window if user clicks exe again
                    LaunchAppWindow();
                    return;
                }

                baseDir = AppDomain.CurrentDomain.BaseDirectory;

                // 1. Ensure backend server is running
                if (!CheckServerHealth())
                {
                    if (!StartBackendServer())
                    {
                        return; // Startup failed and showed message
                    }
                }

                // 2. Launch Dedicated Desktop Window
                LaunchAppWindow();

                // 3. Setup System Tray Icon for Background Lifecycle Management
                trayIcon = new NotifyIcon();
                trayIcon.Text = "Dairy Farm ERP (Offline)";
                trayIcon.Icon = SystemIcons.Application;
                trayIcon.Visible = true;

                ContextMenu menu = new ContextMenu();
                menu.MenuItems.Add(new MenuItem("Open Dairy Farm ERP", (s, e) => LaunchAppWindow()));
                menu.MenuItems.Add(new MenuItem("-"));
                menu.MenuItems.Add(new MenuItem("Exit Dairy Farm ERP", (s, e) =>
                {
                    ShutdownApp();
                }));

                trayIcon.ContextMenu = menu;
                trayIcon.DoubleClick += (s, e) => LaunchAppWindow();

                trayIcon.ShowBalloonTip(
                    3000,
                    "Dairy Farm ERP",
                    "Application is running. Access it anytime from the system tray or by clicking Open.",
                    ToolTipIcon.Info
                );

                Application.ApplicationExit += (s, e) =>
                {
                    ShutdownApp();
                };

                Application.Run();
            }
        }

        private static bool StartBackendServer()
        {
            string nodePath = FindNodeExecutable();
            if (string.IsNullOrEmpty(nodePath))
            {
                MessageBox.Show(
                    "Node.js runtime was not found.\nPlease make sure Node.js is installed on this PC.",
                    "Dairy Farm ERP - Missing Runtime",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            string serverScript = Path.Combine(baseDir, "node_modules", "tsx", "dist", "cli.mjs");
            string serverTs = Path.Combine(baseDir, "server.ts");

            if (!File.Exists(serverScript) || !File.Exists(serverTs))
            {
                MessageBox.Show(
                    "Application files are missing from:\n" + baseDir,
                    "Dairy Farm ERP - File Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = nodePath,
                Arguments = "\"" + serverScript + "\" \"" + serverTs + "\"",
                WorkingDirectory = baseDir,
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            psi.EnvironmentVariables["PORT"] = PORT.ToString();
            psi.EnvironmentVariables["NODE_ENV"] = "production";

            try
            {
                serverProcess = Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Failed to start backend server:\n" + ex.Message,
                    "Dairy Farm ERP - Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            // Wait up to 30 seconds for server health
            int attempts = 0;
            while (attempts < 60)
            {
                Thread.Sleep(500);
                if (CheckServerHealth())
                {
                    return true;
                }
                if (serverProcess != null && serverProcess.HasExited)
                {
                    MessageBox.Show(
                        "Backend server exited unexpectedly with code " + serverProcess.ExitCode + ".",
                        "Dairy Farm ERP - Server Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return false;
                }
                attempts++;
            }

            MessageBox.Show(
                "Backend server startup timed out. Please check logs.",
                "Dairy Farm ERP - Timeout",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning
            );
            return false;
        }

        private static void LaunchAppWindow()
        {
            try
            {
                string edgePath = FindEdgeExecutable();
                string userDataDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "DairyFarmERP",
                    "AppProfile"
                );

                if (!string.IsNullOrEmpty(edgePath))
                {
                    ProcessStartInfo edgePsi = new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = "--app=" + APP_URL + " --window-size=1366,850 --user-data-dir=\"" + userDataDir + "\" --app-id=DairyFarmERP",
                        UseShellExecute = false
                    };
                    Process.Start(edgePsi);
                }
                else
                {
                    Process.Start(new ProcessStartInfo(APP_URL) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Could not open application window:\n" + ex.Message,
                    "Dairy Farm ERP",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static bool CheckServerHealth()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(HEALTH_URL);
                req.Method = "GET";
                req.Timeout = 1200;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static string FindNodeExecutable()
        {
            string standardPath = @"C:\Program Files\nodejs\node.exe";
            if (File.Exists(standardPath)) return standardPath;

            string standardPathX86 = @"C:\Program Files (x86)\nodejs\node.exe";
            if (File.Exists(standardPathX86)) return standardPathX86;

            string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
            string[] dirs = pathEnv.Split(';');
            foreach (string dir in dirs)
            {
                string full = Path.Combine(dir.Trim(), "node.exe");
                if (File.Exists(full)) return full;
            }

            return "node.exe";
        }

        private static string FindEdgeExecutable()
        {
            string p1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(p1)) return p1;

            string p2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(p2)) return p2;

            return null;
        }

        private static void ShutdownApp()
        {
            try
            {
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                    trayIcon = null;
                }

                if (serverProcess != null && !serverProcess.HasExited)
                {
                    Process killer = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = "/PID " + serverProcess.Id + " /T /F",
                        CreateNoWindow = true,
                        UseShellExecute = false
                    });
                    if (killer != null)
                    {
                        killer.WaitForExit(3000);
                    }
                }
            }
            catch { }
            finally
            {
                Application.Exit();
            }
        }
    }
}
