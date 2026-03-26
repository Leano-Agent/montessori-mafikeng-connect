# Montessori Mafikeng Connect - Testing Guide for Staff

## 👋 Welcome to Testing!

Thank you for helping test Africa's first Setswana-first Montessori platform! This guide will help you test the platform and provide valuable feedback.

## 📱 Test Accounts

### Teacher Account
- **Email**: teacher@test.montessorimafikeng.org
- **Password**: Teacher123!
- **Role**: Teacher
- **Access**: Classroom management, observations, parent communication

### Parent Account
- **Email**: parent@test.montessorimafikeng.org
- **Password**: Parent123!
- **Role**: Parent
- **Access**: Child progress, messages, announcements

### Admin Account
- **Email**: admin@test.montessorimafikeng.org
- **Password**: Admin123!
- **Role**: Administrator
- **Access**: User management, system settings, reports

### Principal Account
- **Email**: principal@test.montessorimafikeng.org
- **Password**: Principal123!
- **Role**: Principal
- **Access**: School overview, analytics, staff management

## 🎯 What to Test

### 1. Authentication & Login
- [ ] Login with test accounts
- [ ] Language switcher (Setswana/English)
- [ ] Password reset flow
- [ ] Logout functionality

### 2. Teacher Features
- [ ] **Dashboard**: View class overview
- [ ] **Students**: View student list and profiles
- [ ] **Observations**: Create new Montessori observations
  - Select student
  - Choose Montessori area (Practical Life, Sensorial, etc.)
  - Add observation notes
  - Upload photo/voice recording
  - Set work cycle duration
  - Rate concentration level
- [ ] **Messages**: Send/receive messages to parents
- [ ] **Calendar**: View school events
- [ ] **Materials**: Check Montessori materials status

### 3. Parent Features
- [ ] **Dashboard**: View child's daily updates
- [ ] **Progress**: View child's progress by Montessori area
- [ ] **Messages**: Communicate with teachers
- [ ] **Announcements**: View school announcements
- [ ] **Events**: Check upcoming school events

### 4. Mobile Experience
- [ ] **Install as PWA**: Add to home screen
- [ ] **Offline Mode**: Use without internet
- [ ] **Touch Interface**: Test on mobile device
- [ ] **Voice Messages**: Record and play voice messages

### 5. Setswana Language
- [ ] **Default Language**: Interface should be in Setswana
- [ ] **Language Switcher**: Switch between Setswana and English
- [ ] **Cultural Elements**: African design aesthetics
- [ ] **Voice Interface**: Setswana voice messages

## 📝 Test Scenarios

### Scenario 1: Teacher Creates Observation
1. Login as teacher
2. Go to Observations → New Observation
3. Select a student
4. Choose "Practical Life" area
5. Write observation: "Ke ne ke lebelela [Student] a dirang tiro ya botshelo. O ne a bontsha boikaelelo jo bo kwa godimo le go ikemela."
6. Upload a photo (optional)
7. Set work cycle: 45 minutes
8. Set concentration: 4/5
9. Save observation
10. Verify it appears in observations list

### Scenario 2: Parent Views Child Progress
1. Login as parent
2. View dashboard with child's updates
3. Click on "Progress" tab
4. View progress by Montessori areas
5. Check recent observations from teachers
6. Send message to teacher about progress

### Scenario 3: Offline Usage
1. Turn off WiFi/mobile data
2. Try to create observation (should queue for sync)
3. View existing data (should work offline)
4. Send message (should queue)
5. Turn internet back on
6. Verify sync happens automatically

### Scenario 4: Voice Messages
1. As teacher, go to Messages
2. Select parent contact
3. Click microphone icon
4. Record voice message in Setswana
5. Send message
6. As parent, play voice message

## 🐛 How to Report Issues

### Issue Template
When reporting issues, please include:

1. **What you were trying to do**
2. **What happened instead**
3. **Steps to reproduce**
4. **Device/browser information**
5. **Screenshots (if possible)**

### Example Issue Report
```
Issue: Cannot save observation
User: Teacher Thandi
Device: Samsung Galaxy A12, Chrome browser

Steps:
1. Logged in as teacher
2. Clicked "New Observation"
3. Filled all fields
4. Clicked "Save"
5. Got error: "Network error"

Expected: Observation should save successfully
Actual: Error message appears
```

## 💡 Feedback Categories

### 1. Usability
- Is the interface easy to understand?
- Can you find what you need quickly?
- Are buttons and menus intuitive?

### 2. Montessori Alignment
- Does the platform support Montessori philosophy?
- Are observation fields appropriate?
- Does it respect individual progress tracking?

### 3. Cultural Relevance
- Is Setswana language implementation good?
- Are African design elements appropriate?
- Does it feel culturally relevant?

### 4. Performance
- Does it load quickly?
- Is it responsive on mobile?
- Does offline mode work well?

### 5. Accessibility
- Can low-literacy users navigate it?
- Is voice interface helpful?
- Are colors and contrast good?

## 📊 Success Metrics

Please rate these aspects (1-5, where 5 is excellent):

### For Teachers
- [ ] Ease of recording observations: ____/5
- [ ] Communication with parents: ____/5
- [ ] Student progress tracking: ____/5
- [ ] Mobile usability: ____/5
- [ ] Overall satisfaction: ____/5

### For Parents
- [ ] Understanding child's progress: ____/5
- [ ] Communication with teachers: ____/5
- [ ] Mobile accessibility: ____/5
- [ ] Language support: ____/5
- [ ] Overall satisfaction: ____/5

## 🎁 Test Rewards

As a thank you for testing:
- Your feedback will directly improve the platform
- You'll be among the first to use Africa's first Setswana Montessori platform
- You'll receive training on the final version
- Your school will get priority support

## ⏰ Testing Timeline

### Week 1: Exploration
- Get familiar with the platform
- Try all user roles
- Note initial impressions

### Week 2: Deep Testing
- Test specific scenarios
- Try edge cases
- Test on different devices

### Week 3: Real Usage
- Use as you would in real school context
- Test with colleagues
- Gather comprehensive feedback

## 📞 Support During Testing

### Technical Support
- Email: support@montessorimafikeng.org
- WhatsApp: +27 XX XXX XXXX
- Hours: 8:00-17:00 weekdays

### Montessori Guidance
- Contact: Montessori Coordinator
- For questions about Montessori alignment
- Observation methodology guidance

## 🔄 Feedback Submission

### Option 1: Online Form
Submit feedback at: [Feedback Form URL]

### Option 2: Email
Send to: feedback@montessorimafikeng.org

### Option 3: In-App Feedback
Use the feedback button in the app

## 🎉 Thank You!

Your testing is crucial for creating a platform that truly serves African Montessori education. Together, we're building something special for our children and our continent.

**Ke a leboga! Thank you!**

---

**Testing Period**: March 26 - April 16, 2026  
**Platform**: Montessori Mafikeng Connect  
**Version**: 0.1.0 (Beta)  
**Built with ❤️ in Africa, for Africa**