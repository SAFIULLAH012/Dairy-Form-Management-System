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
        private static readonly string HEALTH_URL = "http://127.0.0.1:" + PORT + "/api/health";
        private static readonly string APP_URL = "http://127.0.0.1:" + PORT;

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
                trayIcon.Text = "BA Farm - Dairy ERP";
                string iconPath = Path.Combine(baseDir, "ba-farm.ico");
                if (File.Exists(iconPath))
                {
                    try { trayIcon.Icon = new Icon(iconPath); }
                    catch { trayIcon.Icon = SystemIcons.Application; }
                }
                else
                {
                    trayIcon.Icon = SystemIcons.Application;
                }
                trayIcon.Visible = true;

                ContextMenu menu = new ContextMenu();
                menu.MenuItems.Add(new MenuItem("Open BA Farm", (s, e) => LaunchAppWindow()));
                menu.MenuItems.Add(new MenuItem("-"));
                menu.MenuItems.Add(new MenuItem("Exit BA Farm", (s, e) =>
                {
                    ShutdownApp();
                }));

                trayIcon.ContextMenu = menu;
                trayIcon.DoubleClick += (s, e) => LaunchAppWindow();

                trayIcon.ShowBalloonTip(
                    3000,
                    "BA Farm",
                    "BA Farm is active. Access it anytime from the system tray or double-click to open.",
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

            // Free port 3001 if occupied by an unresponsive or orphan process
            FreePortIfOccupied(PORT);

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
                string browserPath = FindBrowserExecutable();
                string userDataDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "BAFarm",
                    "AppProfile"
                );

                if (!string.IsNullOrEmpty(browserPath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = browserPath,
                        Arguments = "--app=\"" + APP_URL + "\" --new-window --window-size=1366,850 --user-data-dir=\"" + userDataDir + "\" --app-id=BAFarmERP --no-first-run --no-default-browser-check",
                        UseShellExecute = false
                    };
                    Process.Start(psi);
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
                    "BA Farm",
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

        private static string FindBrowserExecutable()
        {
            string p1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(p1)) return p1;

            string p2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(p2)) return p2;

            string chrome = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (File.Exists(chrome)) return chrome;

            string chromeX86 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            if (File.Exists(chromeX86)) return chromeX86;

            return null;
        }

        private static void FreePortIfOccupied(int port)
        {
            try
            {
                Process netstat = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c netstat -ano | findstr :" + port,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };
                netstat.Start();
                string output = netstat.StandardOutput.ReadToEnd();
                netstat.WaitForExit();

                char[] sep = new char[] { '\r', '\n' };
                string[] lines = output.Split(sep, StringSplitOptions.RemoveEmptyEntries);
                foreach (string line in lines)
                {
                    if (line.Contains("LISTENING") || line.Contains("LISTEN"))
                    {
                        string[] parts = line.Trim().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length > 0)
                        {
                            string pidStr = parts[parts.Length - 1];
                            int pid;
                            if (int.TryParse(pidStr, out pid) && pid > 0)
                            {
                                try
                                {
                                    Process p = Process.GetProcessById(pid);
                                    if (p.ProcessName.ToLower().Contains("node"))
                                    {
                                        KillProcessTree(p);
                                        Thread.Sleep(500);
                                    }
                                }
                                catch { }
                            }
                        }
                    }
                }
            }
            catch { }
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
                    KillProcessTree(serverProcess);
                }
            }
            catch { }
            finally
            {
                Application.Exit();
            }
        }

        private static void KillProcessTree(Process proc)
        {
            if (proc == null) return;
            try
            {
                if (!proc.HasExited)
                {
                    Process killer = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = "/PID " + proc.Id + " /T /F",
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
        }
    }
}
