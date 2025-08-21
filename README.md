# Club Volunteer Management System

A comprehensive volunteer management system for club work hour events with persistent database storage, automated email notifications, and secure gate code validation.

## 🚀 Features

### **Public Volunteer Interface**
- **Event Overview**: Clear display of event details and requirements
- **Current Volunteers**: Real-time display of who's signed up for each task
- **Easy Signup**: User-friendly form with gate code validation
- **Progress Tracking**: Visual indicators showing volunteer needs vs. commitments
- **Automated Emails**: Thank you confirmations sent to volunteers

### **Organizer Admin Panel**
- **Password Protection**: Secure access (password: 5791)
- **Event Configuration**: Set up event details, tasks, and requirements
- **Real-time Monitoring**: Live view of volunteer signups and progress
- **Print Functionality**: Generate volunteer lists and schedules
- **Email Notifications**: Automatic roster updates after each signup

### **Security & Validation**
- **Gate Code System**: Volunteers use code 1957 for signups/removals
- **Secure Admin Access**: Organizer password 5791 (no hints provided)
- **Data Persistence**: JSON file database for permanent storage

## 📋 System Requirements

- **Node.js** 14.0.0 or higher
- **NPM** (comes with Node.js)
- **Email Account** (Gmail recommended for notifications)

## 🛠️ Installation & Setup

### **1. Clone Repository**
```bash
git clone https://github.com/HVSCMA/club-volunteer-system.git
cd club-volunteer-system
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# Set EMAIL_USER and EMAIL_PASS for automated notifications
```

### **4. Start the System**
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

### **5. Access the System**
- **Main Page**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

## 📧 Email Configuration

For automated email notifications, configure Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**: Google Account → Security → 2-Step Verification → App Passwords
3. **Update .env file**:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

## 🔐 Security Codes

- **Volunteer Gate Code**: 1957 (for signups and removals)
- **Organizer Password**: 5791 (for admin panel access)

## 📁 System Architecture

```
club-volunteer-system/
├── server.js              # Main Node.js server
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── data/                  # Database files (auto-created)
│   ├── events.json        # Event configuration
│   └── volunteers.json    # Volunteer records
└── public/                # Frontend files
    ├── index.html         # Main volunteer page
    ├── admin.html         # Organizer admin panel
    ├── style.css          # Styling and responsive design
    └── script.js          # Frontend JavaScript
```

## 🎯 Usage Guide

### **For Volunteers**
1. Visit the main page
2. Review event details and current volunteer commitments
3. Fill out signup form
4. Enter gate code 1957 when prompted
5. Receive automatic confirmation email

### **For Organizers**
1. Visit `/admin` page
2. Enter password 5791
3. Configure event details and tasks
4. Monitor volunteer signups in real-time
5. Print volunteer lists as needed
6. Receive email updates after each signup

## 🔧 Customization

### **Event Configuration**
- Access admin panel to set event name, date, time, and description
- Add/remove tasks with specific volunteer requirements
- Set organizer email for automatic notifications

### **Visual Customization**
- Edit `public/style.css` for colors, fonts, and layout
- Modify `public/index.html` for content structure
- Update logos and branding in header section

### **Code Customization**
- Change gate codes in `server.js` (VOLUNTEER_GATE_CODE, ORGANIZER_GATE_CODE)
- Modify email templates in server.js for custom messaging
- Adjust database schema in server.js for additional fields

## 📊 Data Management

### **Database Files**
- **events.json**: Stores current event configuration and volunteer assignments
- **volunteers.json**: Complete history of all volunteer signups

### **Backup Strategy**
- Regularly backup the `data/` directory
- Export volunteer lists before events
- Keep copies of configuration for recurring events

## 🚀 Deployment Options

### **Local Deployment**
- Run on any computer with Node.js
- Access via localhost for single-computer use

### **Network Deployment**
- Deploy on local network server for club-wide access
- Use services like Heroku, Vercel, or DigitalOcean for internet access

### **Cloud Deployment**
- **Heroku**: Easy deployment with built-in scaling
- **Vercel**: Great for static hosting with serverless functions
- **DigitalOcean**: Full control with VPS deployment

## 🔍 Troubleshooting

### **Common Issues**
- **Email not sending**: Check Gmail app password and 2FA settings
- **Gate code not working**: Verify codes in server.js match interface
- **Data not persisting**: Ensure `data/` directory has write permissions
- **Port already in use**: Change PORT in .env file

### **Debug Mode**
```bash
# Run with detailed logging
NODE_ENV=development npm start
```

## 📈 Features Roadmap

- **Database Integration**: MongoDB/PostgreSQL support
- **Multi-Event Support**: Manage multiple events simultaneously  
- **Volunteer History**: Track volunteer participation over time
- **SMS Notifications**: Text message confirmations and reminders
- **Calendar Integration**: Export events to Google Calendar/Outlook
- **Photo Upload**: Allow volunteers to upload profile photos

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For questions or support:
- Create an issue on GitHub
- Email: [organizer contact information]
- Documentation: See inline comments in source code

---

**Built for club volunteer management with ❤️ by Glenn Fitzgerald - Hudson Valley Sold**

*Last Updated: August 2025*
