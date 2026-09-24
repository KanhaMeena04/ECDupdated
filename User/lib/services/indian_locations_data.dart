class IndianCity {
  final String name;
  final String state;
  final double lat;
  final double lng;
  final String? popularArea;
  final bool isPopular;

  const IndianCity({
    required this.name,
    required this.state,
    required this.lat,
    required this.lng,
    this.popularArea,
    this.isPopular = false,
  });

  String get fullAddress => (popularArea != null && popularArea!.isNotEmpty)
      ? '$popularArea, $name, $state, India'
      : '$name, $state, India';
}

class IndianLocationsData {
  static const List<IndianCity> popularCities = [
    IndianCity(
      name: 'Indore',
      state: 'Madhya Pradesh',
      lat: 22.7533,
      lng: 75.8937,
      popularArea: 'Vijay Nagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Bhopal',
      state: 'Madhya Pradesh',
      lat: 23.2599,
      lng: 77.4126,
      popularArea: 'MP Nagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Sohna',
      state: 'Haryana',
      lat: 28.2467,
      lng: 77.0177,
      popularArea: 'Main Market',
      isPopular: true,
    ),
    IndianCity(
      name: 'Gurgaon',
      state: 'Haryana',
      lat: 28.4595,
      lng: 77.0266,
      popularArea: 'Cyber City',
      isPopular: true,
    ),
    IndianCity(
      name: 'Delhi',
      state: 'Delhi',
      lat: 28.6139,
      lng: 77.2090,
      popularArea: 'Connaught Place',
      isPopular: true,
    ),
    IndianCity(
      name: 'Mumbai',
      state: 'Maharashtra',
      lat: 19.0760,
      lng: 72.8777,
      popularArea: 'Bandra West',
      isPopular: true,
    ),
    IndianCity(
      name: 'Pune',
      state: 'Maharashtra',
      lat: 18.5204,
      lng: 73.8567,
      popularArea: 'Kothrud',
      isPopular: true,
    ),
    IndianCity(
      name: 'Bengaluru',
      state: 'Karnataka',
      lat: 12.9716,
      lng: 77.5946,
      popularArea: 'Indiranagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Hyderabad',
      state: 'Telangana',
      lat: 17.3850,
      lng: 78.4867,
      popularArea: 'Banjara Hills',
      isPopular: true,
    ),
    IndianCity(
      name: 'Jaipur',
      state: 'Rajasthan',
      lat: 26.9124,
      lng: 75.7873,
      popularArea: 'Malviya Nagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Ahmedabad',
      state: 'Gujarat',
      lat: 23.0225,
      lng: 72.5714,
      popularArea: 'SG Highway',
      isPopular: true,
    ),
    IndianCity(
      name: 'Surat',
      state: 'Gujarat',
      lat: 21.1702,
      lng: 72.8311,
      popularArea: 'Vesu',
      isPopular: true,
    ),
    IndianCity(
      name: 'Lucknow',
      state: 'Uttar Pradesh',
      lat: 26.8467,
      lng: 80.9462,
      popularArea: 'Gomti Nagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Noida',
      state: 'Uttar Pradesh',
      lat: 28.5355,
      lng: 77.3910,
      popularArea: 'Sector 18',
      isPopular: true,
    ),
    IndianCity(
      name: 'Kolkata',
      state: 'West Bengal',
      lat: 22.5726,
      lng: 88.3639,
      popularArea: 'Park Street',
      isPopular: true,
    ),
    IndianCity(
      name: 'Chandigarh',
      state: 'Punjab',
      lat: 30.7333,
      lng: 76.7794,
      popularArea: 'Sector 17',
      isPopular: true,
    ),
    IndianCity(
      name: 'Patna',
      state: 'Bihar',
      lat: 25.5941,
      lng: 85.1376,
      popularArea: 'Boring Road',
      isPopular: true,
    ),
    IndianCity(
      name: 'Bhubaneswar',
      state: 'Odisha',
      lat: 20.2961,
      lng: 85.8245,
      popularArea: 'Saheed Nagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Kochi',
      state: 'Kerala',
      lat: 9.9312,
      lng: 76.2673,
      popularArea: 'Marine Drive',
      isPopular: true,
    ),
    IndianCity(
      name: 'Dehradun',
      state: 'Uttarakhand',
      lat: 30.3165,
      lng: 78.0322,
      popularArea: 'Rajpur Road',
      isPopular: true,
    ),
    IndianCity(
      name: 'Raipur',
      state: 'Chhattisgarh',
      lat: 21.2514,
      lng: 81.6296,
      popularArea: 'Shankar Nagar',
      isPopular: true,
    ),
    IndianCity(
      name: 'Ranchi',
      state: 'Jharkhand',
      lat: 23.3441,
      lng: 85.3096,
      popularArea: 'Main Road',
      isPopular: true,
    ),
  ];

  static const Map<String, List<IndianCity>> statesAndCities = {
    'Madhya Pradesh': [
      IndianCity(name: 'Indore', state: 'Madhya Pradesh', lat: 22.7533, lng: 75.8937, popularArea: 'Vijay Nagar'),
      IndianCity(name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, popularArea: 'MP Nagar'),
      IndianCity(name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864, popularArea: 'Civil Lines'),
      IndianCity(name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828, popularArea: 'City Centre'),
      IndianCity(name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885, popularArea: 'Freeganj'),
      IndianCity(name: 'Sagar', state: 'Madhya Pradesh', lat: 23.8388, lng: 78.7378),
      IndianCity(name: 'Dewas', state: 'Madhya Pradesh', lat: 22.9676, lng: 76.0534),
      IndianCity(name: 'Ratlam', state: 'Madhya Pradesh', lat: 23.3315, lng: 75.0367),
      IndianCity(name: 'Rewa', state: 'Madhya Pradesh', lat: 24.5362, lng: 81.3037),
      IndianCity(name: 'Satna', state: 'Madhya Pradesh', lat: 24.6005, lng: 80.8322),
    ],
    'Haryana & Delhi NCR': [
      IndianCity(name: 'Gurgaon (Gurugram)', state: 'Haryana', lat: 28.4595, lng: 77.0266, popularArea: 'Cyber City'),
      IndianCity(name: 'Sohna', state: 'Haryana', lat: 28.2467, lng: 77.0177, popularArea: 'Main Market'),
      IndianCity(name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, popularArea: 'Connaught Place'),
      IndianCity(name: 'South Delhi', state: 'Delhi', lat: 28.5244, lng: 77.2066, popularArea: 'Saket'),
      IndianCity(name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178, popularArea: 'Sector 15'),
      IndianCity(name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, popularArea: 'Sector 18'),
      IndianCity(name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538, popularArea: 'Indirapuram'),
      IndianCity(name: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635),
      IndianCity(name: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767),
      IndianCity(name: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905),
      IndianCity(name: 'Hisar', state: 'Haryana', lat: 29.1492, lng: 75.7217),
      IndianCity(name: 'Rohtak', state: 'Haryana', lat: 28.8955, lng: 76.6066),
      IndianCity(name: 'Sonipat', state: 'Haryana', lat: 28.9931, lng: 77.0151),
    ],
    'Maharashtra': [
      IndianCity(name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, popularArea: 'Bandra West'),
      IndianCity(name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, popularArea: 'Kothrud'),
      IndianCity(name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, popularArea: 'Dharampeth'),
      IndianCity(name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, popularArea: 'Ghodbunder Road'),
      IndianCity(name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lng: 73.0297, popularArea: 'Vashi'),
      IndianCity(name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, popularArea: 'College Road'),
      IndianCity(name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', lat: 19.8762, lng: 75.3433),
      IndianCity(name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064),
      IndianCity(name: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433),
    ],
    'Uttar Pradesh': [
      IndianCity(name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, popularArea: 'Gomti Nagar'),
      IndianCity(name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, popularArea: 'Civil Lines'),
      IndianCity(name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, popularArea: 'Assi Ghat'),
      IndianCity(name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, popularArea: 'Sanjay Place'),
      IndianCity(name: 'Prayagraj (Allahabad)', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463),
      IndianCity(name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064),
      IndianCity(name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304),
      IndianCity(name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880),
      IndianCity(name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732),
      IndianCity(name: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737),
    ],
    'Rajasthan': [
      IndianCity(name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, popularArea: 'Malviya Nagar'),
      IndianCity(name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, popularArea: 'Sardarpura'),
      IndianCity(name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125, popularArea: 'Fateh Sagar'),
      IndianCity(name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648, popularArea: 'Talwandi'),
      IndianCity(name: 'Bikaner', state: 'Rajasthan', lat: 28.0229, lng: 73.3119),
      IndianCity(name: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399),
      IndianCity(name: 'Bhilwara', state: 'Rajasthan', lat: 25.3463, lng: 74.6364),
      IndianCity(name: 'Alwar', state: 'Rajasthan', lat: 27.5530, lng: 76.6346),
    ],
    'Gujarat': [
      IndianCity(name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, popularArea: 'SG Highway'),
      IndianCity(name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, popularArea: 'Vesu'),
      IndianCity(name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812, popularArea: 'Alkapuri'),
      IndianCity(name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022, popularArea: 'Kalawad Road'),
      IndianCity(name: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519),
      IndianCity(name: 'Jamnagar', state: 'Gujarat', lat: 22.4707, lng: 70.0577),
      IndianCity(name: 'Gandhinagar', state: 'Gujarat', lat: 23.2156, lng: 72.6369),
    ],
    'Karnataka': [
      IndianCity(name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, popularArea: 'Indiranagar'),
      IndianCity(name: 'Mysuru (Mysore)', state: 'Karnataka', lat: 12.2958, lng: 76.6394, popularArea: 'Gokulam'),
      IndianCity(name: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.8560),
      IndianCity(name: 'Hubballi-Dharwad', state: 'Karnataka', lat: 15.3647, lng: 75.1240),
      IndianCity(name: 'Belagavi', state: 'Karnataka', lat: 15.8497, lng: 74.4977),
      IndianCity(name: 'Kalaburagi', state: 'Karnataka', lat: 17.3297, lng: 76.8343),
    ],
    'Telangana & Andhra Pradesh': [
      IndianCity(name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, popularArea: 'Banjara Hills'),
      IndianCity(name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, popularArea: 'MVP Colony'),
      IndianCity(name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480),
      IndianCity(name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941),
      IndianCity(name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365),
      IndianCity(name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192),
      IndianCity(name: 'Nizamabad', state: 'Telangana', lat: 18.6725, lng: 78.0941),
    ],
    'Tamil Nadu & Kerala': [
      IndianCity(name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, popularArea: 'T. Nagar'),
      IndianCity(name: 'Kochi (Cochin)', state: 'Kerala', lat: 9.9312, lng: 76.2673, popularArea: 'Marine Drive'),
      IndianCity(name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, popularArea: 'RS Puram'),
      IndianCity(name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366),
      IndianCity(name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198),
      IndianCity(name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804),
      IndianCity(name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047),
      IndianCity(name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460),
    ],
    'Punjab & Chandigarh': [
      IndianCity(name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794, popularArea: 'Sector 17'),
      IndianCity(name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573, popularArea: 'Sarabha Nagar'),
      IndianCity(name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723, popularArea: 'Ranjit Avenue'),
      IndianCity(name: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762, popularArea: 'Model Town'),
      IndianCity(name: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869),
      IndianCity(name: 'Mohali', state: 'Punjab', lat: 30.7046, lng: 76.7179),
    ],
    'West Bengal & Bihar': [
      IndianCity(name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, popularArea: 'Park Street'),
      IndianCity(name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, popularArea: 'Boring Road'),
      IndianCity(name: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636),
      IndianCity(name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953),
      IndianCity(name: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002),
      IndianCity(name: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647),
      IndianCity(name: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9842),
      IndianCity(name: 'Durgapur', state: 'West Bengal', lat: 23.5204, lng: 87.3119),
    ],
    'Odisha & Jharkhand': [
      IndianCity(name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, popularArea: 'Saheed Nagar'),
      IndianCity(name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, popularArea: 'Main Road'),
      IndianCity(name: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8828, popularArea: 'CDA Sector'),
      IndianCity(name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lng: 86.2029, popularArea: 'Bistupur'),
      IndianCity(name: 'Brahmabarada', state: 'Odisha', lat: 20.7399, lng: 86.2438),
      IndianCity(name: 'Rourkela', state: 'Odisha', lat: 22.2604, lng: 84.8536),
      IndianCity(name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304),
      IndianCity(name: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312),
    ],
    'Uttarakhand & Himachal': [
      IndianCity(name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, popularArea: 'Rajpur Road'),
      IndianCity(name: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642),
      IndianCity(name: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676),
      IndianCity(name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, popularArea: 'Mall Road'),
      IndianCity(name: 'Dharamshala', state: 'Himachal Pradesh', lat: 32.2190, lng: 76.3234),
      IndianCity(name: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892),
      IndianCity(name: 'Haldwani', state: 'Uttarakhand', lat: 29.2183, lng: 79.5130),
      IndianCity(name: 'Roorkee', state: 'Uttarakhand', lat: 29.8543, lng: 77.8880),
    ],
    'Chhattisgarh & Goa': [
      IndianCity(name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, popularArea: 'Shankar Nagar'),
      IndianCity(name: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278, popularArea: 'Miramar'),
      IndianCity(name: 'Bhilai', state: 'Chhattisgarh', lat: 21.1938, lng: 81.3509),
      IndianCity(name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409),
      IndianCity(name: 'Margao', state: 'Goa', lat: 15.2832, lng: 73.9862),
      IndianCity(name: 'Korba', state: 'Chhattisgarh', lat: 22.3595, lng: 82.7501),
    ],
    'Assam & North East': [
      IndianCity(name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, popularArea: 'GS Road'),
      IndianCity(name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933, popularArea: 'Police Bazar'),
      IndianCity(name: 'Silchar', state: 'Assam', lat: 24.8170, lng: 92.7985),
      IndianCity(name: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120),
      IndianCity(name: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868),
      IndianCity(name: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368),
    ],
    'Jammu & Kashmir': [
      IndianCity(name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973, popularArea: 'Lal Chowk'),
      IndianCity(name: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lng: 74.8570, popularArea: 'Gandhi Nagar'),
    ],
  };

  /// Searches all cities and states locally
  static List<IndianCity> searchLocal(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return [];

    final Set<IndianCity> results = {};
    for (final stateEntry in statesAndCities.entries) {
      final stateName = stateEntry.key.toLowerCase();
      final isStateMatch = stateName.contains(q);

      for (final city in stateEntry.value) {
        final cityName = city.name.toLowerCase();
        final cityState = city.state.toLowerCase();
        final area = (city.popularArea ?? '').toLowerCase();

        if (isStateMatch || cityName.contains(q) || cityState.contains(q) || area.contains(q)) {
          results.add(city);
        }
      }
    }
    return results.toList();
  }
}
